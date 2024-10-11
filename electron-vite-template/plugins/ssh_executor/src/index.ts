import {InstructContent, InstructExecutor} from '../../../src/main/plugin/type/bridge'
import {Pluginlifecycle} from '../../../src/main/plugin/type/plugin-lifecycle'
import { PluginExtensionContext } from "../../../src/main/plugin/type/plugin";

const end_tag = "=== Done ===";
class SshExecutor implements InstructExecutor,Pluginlifecycle{
  execute(instruct: InstructContent): Promise<string | void> {
    return new Promise((resolve,reject)=>{
      let executeing = true;
      let results:string[] = []
      // 将 PTY 输出发送到前端
      const disable = pluginContext.pty.onData((data:string) => {
        
        if (executeing) {
          results.push(data)
          const lines = data.split(/\r?\n/); // 按换行符分割
          for (const line of lines) {
            console.log(`读取行:${line}`, executeing,data.trim() === end_tag); 
            if (line.trim() === end_tag) {
              // executeing = false;
              console.log("代码执行完毕", results.join())
              resolve(results.join())
              disable.dispose()
            }
          }
        }
      });
      const cmd = instruct.code + ' ; echo ' + end_tag + '\n';
      console.log(`发送指令:${cmd}`);
      pluginContext.pty.write(cmd)
    })
  }
  
  onMounted(ctx: PluginExtensionContext): void {
    global.pluginContext = ctx;
  }
  onUnmounted(ctx: PluginExtensionContext): void {
  }
 
  
}
export default new SshExecutor();
