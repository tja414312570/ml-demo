import { sayHello } from "./hello";
import {Bridge} from '../../../src/main/plugin/type/bridge'
import {Pluginlifecycle} from '../../../src/main/plugin/type/plugin-lifecycle'

class ChatGptBridge implements Bridge,Pluginlifecycle{
  onMounted(): void {
    sayHello("Plugin")
    throw new Error("Method not implemented.");
  }
  onUnmounted(): void {
    throw new Error("Method not implemented.");
  }
  onResponse(body: any): void {
    throw new Error("Method not implemented.");
  }
  
}
export default new ChatGptBridge();
