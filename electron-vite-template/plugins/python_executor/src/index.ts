import { InstructContent, InstructExecutor, InstructResult } from '../../../src/main/plugin/type/bridge'
import { Pluginlifecycle } from '../../../src/main/plugin/type/plugin-lifecycle'
import { PluginExtensionContext } from "../../../src/main/plugin/type/plugin";
import { v4 as uuidv4 } from 'uuid';
import { runPythonCode } from './python';

class PythonExecutor implements InstructExecutor, Pluginlifecycle {
  execute(instruct: InstructContent): Promise<InstructResult> {
    const { id, code } = instruct;

    return new Promise((resolve, reject) => {
      runPythonCode(code)
        .then(result => {
          pluginContext.sendIpcRender('codeViewApi.insertLine', { id, code: `控制台：\r\n${result}`, line: code.split(/\r?\n/).length })
          console.log('Python 输出:', result);  // 处理 Python 输出
          resolve({
            id,
            std: result,
          })
        })
        .catch(error => {
          console.error('执行 Python 代码时出错:', error);
          pluginContext.sendIpcRender('codeViewApi.insertLine', { id, code: `错误:\r\n${error}`, line: code.split(/\r?\n/).length })
          resolve({
            id,
            std: error,
          })
        });
    });
  }

  onMounted(ctx: PluginExtensionContext): void {
    global.pluginContext = ctx;
  }
  onUnmounted(ctx: PluginExtensionContext): void {
  }


}
export default new PythonExecutor();
