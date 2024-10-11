import EventEmitter from "events";
import { IIpcMain, PluginExtensionContext } from "./type/plugin";
import { Pluginlifecycle } from "./type/plugin-lifecycle";
import { notify, notifyError } from "@main/ipc/notify-manager";
import { app, ipcMain } from "electron";
import { IPty } from "node-pty";
import { wrapper } from "./Iproxy";

class ExtensionContext extends EventEmitter implements PluginExtensionContext {
    pty: IPty;
    ipcMain = wrapper<IIpcMain>(ipcMain);
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