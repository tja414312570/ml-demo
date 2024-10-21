import EventEmitter from "events";
import { IIpcMain, IPty, PluginExtensionContext } from '@lib/main';
import { Pluginlifecycle } from '@lib/main';
import { notify, notifyError } from "@main/ipc/notify-manager";
import { app, ipcMain } from "electron";
import { wrapper } from "./Iproxy";
import { send_ipc_render } from "@main/ipc/send_ipc";

class ExtensionContext extends EventEmitter implements PluginExtensionContext {
    sendIpcRender = send_ipc_render;
    pty: IPty;
    ipcMain = wrapper<IIpcMain>(ipcMain);
    notifyManager = { notify, notifyError };
    public app = app;
    pluginContext: any;
    register(plugin: Pluginlifecycle & any): void {
        console.log(`注册组件${JSON.stringify(plugin)}`)
    }
    remove(plugin: Pluginlifecycle & any): void {
        console.log(`移除组件${JSON.stringify(plugin)}`)
    }

}
export default new ExtensionContext();