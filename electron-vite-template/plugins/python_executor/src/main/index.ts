import { AbstractPlugin, InstructContent, InstructExecutor, InstructResult, InstructResultType } from 'mylib/main'
import { Pluginlifecycle } from 'mylib/main'
import { PluginExtensionContext } from 'mylib/main'
import { v4 as uuidv4 } from 'uuid';
import { runPythonCode } from './python';
import util from 'util'

class PythonExecutor extends AbstractPlugin implements InstructExecutor, Pluginlifecycle {
  abort(instruct: InstructContent): Promise<InstructResult | void> {
    throw new Error('Method not implemented.');
  }
  execute(instruct: InstructContent): Promise<InstructResult> {
    const { id, code } = instruct;
    const execId = uuidv4();
    return new Promise((resolve, reject) => {
      runPythonCode(id,code,execId)
        .then(result => {
          console.log('Python 输出:', result);  // 处理 Python 输出
          resolve({
            id,
            std: result,
            type:InstructResultType.completed,
            execId
          })
        })
        .catch(error => {
          const errorDetails = util.inspect(error, { depth: null, colors: true });
          resolve({
            id,
            std: errorDetails,
            type:InstructResultType.failed,
            execId
          })
        });
    });
  }

  onMounted(ctx: PluginExtensionContext): void {
  }
  onUnmounted(ctx: PluginExtensionContext): void {
  }


}
export default new PythonExecutor();
