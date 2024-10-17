import { InstructContent, InstructExecutor, InstructResult, InstructResultType } from '../../../src/main/plugin/type/bridge'
import { Pluginlifecycle } from '../../../src/main/plugin/type/plugin-lifecycle'
import { PluginExtensionContext } from "../../../src/main/plugin/type/plugin";
import { v4 as uuidv4 } from 'uuid';


const removeInvisibleChars = (str: string) => {
  // 移除 ANSI 转义序列 (\u001b 是转义字符, \[\d*(;\d*)*m 匹配 ANSI 的样式)
  // const noAnsi = str.replace(/\u001b\[\d*(;\d*)*m/g, '');
  // // 移除其他不可见字符 (包括空白符、制表符、换行符)
  // const cleanedStr = noAnsi.replace(/[\x00-\x1F\x7F]/g, ''); // \x00-\x1F 包含不可见字符范围
  let cleanedStr = str.replace(/\u001b\[\d*(;\d*)*m/g, '');

  // 移除 PowerShell 特有的控制字符 (例如，\r\n[?25l 和类似的序列)
  cleanedStr = cleanedStr.replace(/\[\?\d+[a-z]/gi, '');

  // 移除回车和换行符、其他不可见字符 (包括空白符、制表符、换行符)
  cleanedStr = cleanedStr.replace(/[\x00-\x1F\x7F\x80-\x9F]+/g, '');

  // 移除光标定位和清屏等特殊字符序列，例如 [24;21H 和 [1C 之类的
  cleanedStr = cleanedStr.replace(/\[\d+;\d+[A-Za-z]|\[\d+[A-Za-z]/g, '');
  return cleanedStr;
};


function equalsAny(value:any, ...candidates:any[]) {
  return candidates.includes(value);
}

function isCommandSuccessful(exitCode:string|number) {
  return equalsAny(exitCode, 0, '0', true, 'True', 'true');
}
class ExecuteContext {
 
  private _data: ((data: string) => void) | undefined;
  private _write: ((data: string) => void) | undefined;
  private _error:((data:Error) => void) | undefined;
  private _end:(() => void) | undefined;
  private _abort:((message?:any) => void) | undefined;
  callData(data: string) {
    if (!this._data) {
      throw new Error("没有响应回调");
    }
    this._data(data);
  }
  abort(message:string) {
    if (!this._abort) {
      throw new Error("没有终止回调");
    }
    this._abort(message)
  }
  write(data:string){
    if (!this._write) {
      throw new Error("没有发送回调");
    }
    this._write(data);
  }
  error(data:string|Error){
    if (!this._error) {
      throw new Error("没有错误回调");
    }
    if(data instanceof Error){
      this._error(data);
    }else{
      this._error(new Error(data))
    }
    
  }
  end(){
    if (!this._end) {
      throw new Error("没有结束回调");
    }
    this._end();
  }
  onAbort(callback: (data: string) => void) {
    this._abort = callback;
  }
  onWrite(callback: (data: string) => void) {
    this._write = callback;
  }
  onData(callback: (data: string) => void) {
    this._data = callback;
  }
  onError(callback: (data: Error) => void){
    this._error = callback;
  }
  onEnd(callback: () => void){
    this._end = callback;
  }
}

class SshExecutor implements InstructExecutor, Pluginlifecycle {
  private cache:Map<String,ExecuteContext> = new Map();
  abort(instruct: InstructContent): Promise<InstructResult | void> {
    return new Promise(resolve=>{
      const { id } = instruct;
      const context =this.cache.get(id);
      if(context){
        context.abort("用户主动终止");
      }
      pluginContext.pty.write('\x03');
      resolve()
    })
  }
  execute(instruct: InstructContent): Promise<InstructResult> {
    const { id, code } = instruct;
    const execId = uuidv4()
    return new Promise((resolve, reject) => {
      if(this.cache.has(id)){
        throw new Error("代码正在执行中")
      }
      const executeContext = new ExecuteContext();
      this.cache.set(id,executeContext);
      executeContext.onWrite(data=>pluginContext.pty.write(data));
      const disable = pluginContext.pty.onData(data =>  executeContext.callData(data))
      executeContext.onEnd(()=>{
        disable.dispose( )
        this.cache.delete(id)})
      executeContext.onError((err)=>{
        console.error("程序异常:",err)
        executeContext.end();
      })
      executeContext.onAbort((err)=>{
        console.error("程序异常:",err)
        pluginContext.sendIpcRender('codeViewApi.insertLine', {
          id,
          code: `程序终止执行:${err}`,
          execId,
          line,
          type: InstructResultType.completed
        })
        executeContext.end();
      })
      const line = code.split(/\r?\n/).length;
      const code_splits = instruct.code
        .split(/\r?\n/)
        .filter(line => line.trim() && !/^\s*(#|REM|::)/i.test(line));
        (async () => {
          const results = [];
          for (const instruct of code_splits) {
            try {
              const result = await this.executeLine(id, instruct,line, execId, executeContext);
              results.push(result.result);
              if (!isCommandSuccessful(result.code)) {
                results.push("程序异常退出，退出码:"+result.code);
                executeContext.abort(`程序异常退出，退出码${result.code}`)
                break; 
              }
              // 如果需要在执行成功后处理 result，可以在这里添加逻辑
            } catch (error:any) {
              // 在此捕获执行过程中可能发生的错误
              console.error(`Error executing line: ${instruct}`, error);
              executeContext.error(error)
              break; // 如果发生错误，可以选择中断循环
            }
          }
          executeContext.end();
          pluginContext.sendIpcRender('codeViewApi.insertLine', {
            id,
            code: ``,
            execId,
            line,
            type: InstructResultType.completed
          })
          resolve({
              id: instruct.id,
              ret: results.join('\r\n'),
              // std:results.join()
              execId,
              type: InstructResultType.completed
          })
        })();
    });
  }

  executeLine(id: string, instruct: string,line:number, execId: string, executeContext: ExecuteContext): Promise<{result:string,code:string}> {
    let executeing = true;
    let results: string[] = []
    const end_tag = `_${uuidv4()}_`;
    const cmd = process.platform === 'win32' ?
      `try { ${instruct} } catch { Write-Error $_.Exception.Message ;$_.ErrorRecord } finally { Write-Host "${end_tag}$?" }` ://ps
      `${instruct} ; echo "${end_tag}$?"`; //ssh
      const msg = `命令[${instruct}]开始执行,执行id[${end_tag}],命令：${cmd}`;
      console.log(msg)
      pluginContext.notifyManager.notify(msg)
    return new Promise(resolve => {
      // 将 PTY 输出发送到前端
      executeContext.onData((data: string) => {
        if (executeing) {
          const lines = data.split(/\r?\n/); // 按换行符分割
          for (const _line of lines) {
            console.log(`读取行:"${_line}"${executeing}`);
            const lineTrim = removeInvisibleChars(_line);
            if(!executeing){
              return;
            }
            if (lineTrim.length > 1 && lineTrim.startsWith(end_tag)) {
              executeing = false;
              const exitCode = lineTrim.substring(end_tag.length);
              const msg = `命令[${instruct}]执行完成,执行id[${end_tag}]，退出状态[${exitCode}]`;
              console.log(msg)
              pluginContext.notifyManager.notify(msg)
              resolve({result:results.join('\r\n'),code:exitCode});
            } else if (lineTrim.length > 1) {
              const lineTrimProcess = lineTrim.replace(cmd.trim(), instruct);
              results.push(lineTrimProcess)
              pluginContext.sendIpcRender('codeViewApi.insertLine', {
                id,
                code: `${lineTrimProcess}\r\n`,
                execId,
                line,
                type: InstructResultType.executing
              })
            }
          }
        }
      });
      pluginContext.pty.write(cmd)
       pluginContext.pty.write('\r')
    })
  }

  onMounted(ctx: PluginExtensionContext): void {
    global.pluginContext = ctx;
  }
  onUnmounted(ctx: PluginExtensionContext): void {
  }


}
export default new SshExecutor();
