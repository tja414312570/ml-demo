import { ipcRenderer } from "electron";
import { exposeInMainWorld, ipcRenderMapper } from "./ipc-wrapper";
const api = 'plugin-view-api'


console.log("ipcRenderMapper:", ipcRenderer, ipcRenderMapper)
exposeInMainWorld(api, {
    on: (channel, callback) => {
        console.log("webview监听:", channel)
        ipcRenderMapper.on(channel, (event, message) => {
            console.log("webview消息:", message)
            callback(event, message)
        })
    }, invoke: (channel: string, ...args: any) => ipcRenderMapper.invoke(channel, ...args)
})