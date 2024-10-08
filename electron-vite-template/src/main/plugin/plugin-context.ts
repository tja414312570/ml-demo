import { PluginExtensionContext } from "./type/plugin";
import { Pluginlifecycle } from "./type/plugin-lifecycle";

class ExtensionContext implements PluginExtensionContext {
    register(plugin: Pluginlifecycle & any): void {
        console.log(`注册组件${JSON.stringify(plugin)}`)
    }
    remove(plugin: Pluginlifecycle & any): void {
        console.log(`移除组件${JSON.stringify(plugin)}`)
    }
}
export default new ExtensionContext();