import { InstructContent, InstructExecutor, InstructResult } from '../../../src/main/plugin/type/bridge';
import { Pluginlifecycle } from '../../../src/main/plugin/type/plugin-lifecycle';
import { PluginExtensionContext } from "../../../src/main/plugin/type/plugin";
import { createContext, runInContext } from 'vm';
import { AbstractPlugin } from './abstract-plugin';
import {stringify} from 'circular-json';
import { rejects } from 'assert';
import util from 'util'
import fs from 'fs'

class NodeExecutor extends AbstractPlugin implements Pluginlifecycle, InstructExecutor {
  execute(instruct: InstructContent): Promise<InstructResult> {
    const { code, language ,id} = instruct;
    let execute_result = '';
    // 用于捕获标准输出和错误输出
    let stdout = '';

    // 创建上下文，重写 console 和 process 的输出方法
    const vmContext = createContext({
      console: {
        log: (...args: any[]) => {
          stdout += 'log:'+args.join(' ') + '\n';
        },
        error: (...args: any[]) => {
          stdout +=  'err:'+args.join(' ') + '\n';
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
        
        pluginContext.sendIpcRender('codeViewApi.insertLine',{id,code:`控制台：\r\n${stdout}\r\n结果:\r\n${resultString}`,line:code.split(/\r?\n/).length})
        resolve({
          id:instruct.id,
          ret:resultString,
          std:stdout
        });
      } catch (error:any) {
        const errorDetails = util.inspect(error, { depth: null, colors: true });
        const out = (stdout.trim().length>1?'控制台：\r\n'+stdout+'\r\n':'')+'执行异常:'+errorDetails;
        // reject(`执行过程中发生错误: ${errorDetails}\n控制台输出:\n${stdout}`);
        pluginContext.sendIpcRender('codeViewApi.insertLine',{id,code:`${out}\r\n`,line:code.split(/\r?\n/).length})
        resolve({
          id:instruct.id,
          std:out
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
