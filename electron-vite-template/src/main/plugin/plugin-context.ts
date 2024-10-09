import EventEmitter from "events";
import { PluginExtensionContext } from "./type/plugin";
import { Pluginlifecycle } from "./type/plugin-lifecycle";
import { notify, notifyError } from "@main/ipc/notify-manager";
import { app } from "electron";

class ExtensionContext extends EventEmitter implements PluginExtensionContext {
    notifyManager = { notify, notifyError };
    public app = app;
    register(plugin: Pluginlifecycle & any): void {
        console.log(`注册组件${JSON.stringify(plugin)}`)
    }
    remove(plugin: Pluginlifecycle & any): void {
        console.log(`移除组件${JSON.stringify(plugin)}`)
    }
}
export default new ExtensionContext();