import { sayHello } from "./hello";
import {Bridge} from '../../../src/main/plugin/type/bridge'
import {Pluginlifecycle} from '../../../src/main/plugin/type/plugin-lifecycle'
import { PluginExtensionContext } from "../../../src/main/plugin/type/plugin";

class ChatGptBridge implements Bridge,Pluginlifecycle{
  onMounted(ctx: PluginExtensionContext): void {
    sayHello("Plugin")
  }
  onUnmounted(ctx: PluginExtensionContext): void {
  }
  onResponse(body: any): void {
  }
  
}
export default new ChatGptBridge();
