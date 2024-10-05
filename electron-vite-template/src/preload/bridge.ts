import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";


contextBridge.exposeInMainWorld('bridge', {
  on: (channel, func) => {
    if (typeof func === 'function') {
      ipcRenderer.on(channel, (event, ...args) => func(event,...args));
    } else {
      console.error(`The callback provided to ipcRenderer.on for channel "${channel}" is not a function.`);
    }
  },
  invoke: (channel, data) => ipcRenderer.invoke(channel, data)
});
