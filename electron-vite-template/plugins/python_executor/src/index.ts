import { InstructContent, InstructExecutor, InstructResult, InstructResultType } from '../../../src/main/plugin/type/bridge'
import { Pluginlifecycle } from '../../../src/main/plugin/type/plugin-lifecycle'
import { PluginExtensionContext } from "../../../src/main/plugin/type/plugin";
import { v4 as uuidv4 } from 'uuid';
import { runPythonCode } from './python';
import util from 'util'

class PythonExecutor implements InstructExecutor, Pluginlifecycle {
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
    global.pluginContext = ctx;
  }
  onUnmounted(ctx: PluginExtensionContext): void {
  }


}
export default new PythonExecutor();
