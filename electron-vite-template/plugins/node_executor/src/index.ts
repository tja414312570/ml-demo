import { InstructContent, InstructExecutor, InstructResult, InstructResultType } from '../../../src/main/plugin/type/bridge';
import { Pluginlifecycle } from '../../../src/main/plugin/type/plugin-lifecycle';
import { PluginExtensionContext } from "../../../src/main/plugin/type/plugin";
import { createContext, runInContext } from 'vm';
import { AbstractPlugin } from './abstract-plugin';
import {stringify} from 'circular-json';
import { rejects } from 'assert';
import util from 'util'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid';

class NodeExecutor extends AbstractPlugin implements Pluginlifecycle, InstructExecutor {
  execute(instruct: InstructContent): Promise<InstructResult> {
    const { code, language ,id} = instruct;
    let execute_result = '';
    // 用于捕获标准输出和错误输出
    let stdout = '';
    const execId = uuidv4();
    // 创建上下文，重写 console 和 process 的输出方法
    const vmContext = createContext({
      console: {
        log: (...args: any[]) => {
          stdout += 'log:'+args.join(' ') + '\n';
          const temp = []
          for(let arg of args){
              temp.push(util.inspect(arg, { depth: null, colors: true }))
          }
          pluginContext.sendIpcRender('codeViewApi.insertLine',{id,code:`log：${temp.join(',')}\r\n`,line:code.split(/\r?\n/).length,type:InstructResultType.executing})
        },
        error: (...args: any[]) => {
          stdout +=  'err:'+args.join(' ') + '\n';
          const temp = []
          for(let arg of args){
              temp.push(util.inspect(arg, { depth: null, colors: true }))
          }
          pluginContext.sendIpcRender('codeViewApi.insertLine',{id,code:`err:${temp.join(',')}\r\n`,line:code.split(/\r?\n/).length,type:InstructResultType.executing})
        }
      },
      resolve: (result: any) => {
        execute_result = result;
      },
      reject: (error: any) => {
       rejects(error)
      }, require,
      process,
      Buffer,
      fs,
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
    });

    return new Promise((resolve, reject) => {
      try {
        // 执行代码
        runInContext(`(async () => { ${code} })()`, vmContext);
        // 将输出结果序列化并返回
        let resultString = stringify(execute_result);
        
        pluginContext.sendIpcRender('codeViewApi.insertLine',{id,code:`结果:\r\n${resultString}`,line:code.split(/\r?\n/).length,type:InstructResultType.completed})
        resolve({
          id:instruct.id,
          ret:resultString,
          std:stdout,
          execId,
          type:InstructResultType.completed
        });
      } catch (error:any) {
        const errorDetails = util.inspect(error, { depth: null, colors: true });
        const out = (stdout.trim().length>1?'控制台：\r\n'+stdout+'\r\n':'')+'执行异常:'+errorDetails;
        // reject(`执行过程中发生错误: ${errorDetails}\n控制台输出:\n${stdout}`);
        pluginContext.sendIpcRender('codeViewApi.insertLine',{id,code:`${out}\r\n`,line:code.split(/\r?\n/).length})
        resolve({
          id:instruct.id,
          std:out,
          execId,
          type:InstructResultType.failed
        });
      }
    });
  }

  onMounted(ctx: PluginExtensionContext): void {
    // 插件挂载时的处理逻辑
  }

  onUnmounted(ctx: PluginExtensionContext): void {
    // 插件卸载时的处理逻辑
  }
}

export default new NodeExecutor();
