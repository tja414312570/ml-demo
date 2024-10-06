import { contextBridge, ipcRenderer, IpcRendererEvent, shell } from "electron";
import { onUnmounted } from "vue";
import { IpcChannelMainClass, IpcChannelRendererClass } from "../ipc/index";
import { CodeContent } from "@main/ipc/code-manager";

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => {
    if (typeof func === 'function') {
      ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
    } else {
      console.error(`The callback provided to ipcRenderer.on for channel "${channel}" is not a function.`);
    }
  },
  invoke: (channel, data) => ipcRenderer.invoke(channel, data)
});


contextBridge.exposeInMainWorld('codeViewApi', {
  onCode: (callback: Function) => ipcRenderer.on('codeViewApi.code', (event, notifyData) => {
    callback(notifyData);
  }),
  executeCode: (code: CodeContent) => ipcRenderer.invoke("codeViewApi.execute", code),
  onCodeExecuted: (callback: Function) => ipcRenderer.on('codeViewApi.code.executed', (event, notifyData) => {
    callback(notifyData);
  }),
});

contextBridge.exposeInMainWorld('notificationAPI', {
  onReady: () => ipcRenderer.send('notificationAPI-ready'),
  sendNotification: (message, isError = false) => ipcRenderer.send('notify', { message, isError }),
  clearNotification: () => ipcRenderer.send('clear-notification'),
  // 监听通知事件
  onNotify: (callback) => ipcRenderer.on('show-notification', (event, notifyData) => {
    callback(notifyData);
  }),

  // 监听清理通知事件
  onClearNotification: (callback) => ipcRenderer.on('clear-notification', callback),
});

function getIpcRenderer() {
  const IpcRenderer = {};
  Object.keys(new IpcChannelMainClass()).forEach((channel) => {
    console.log(`channel ${channel}`)
    IpcRenderer[channel] = {
      invoke: async (args: any) => ipcRenderer.invoke(channel, args),
    };
  });
  Object.keys(new IpcChannelRendererClass()).forEach((channel) => {
    IpcRenderer[channel] = {
      on: (listener: (...args: any[]) => void) => {
        ipcRenderer.on(channel, listener);
        onUnmounted(() => {
          ipcRenderer.removeListener(channel, listener);
        });
      },
      once: (listener: (...args: any[]) => void) => {
        ipcRenderer.once(channel, listener);
        onUnmounted(() => {
          ipcRenderer.removeListener(channel, listener);
        });
      },
      removeAllListeners: () => ipcRenderer.removeAllListeners(channel),
    };
  });
  return IpcRenderer;
}

contextBridge.exposeInMainWorld("ipcRendererChannel", getIpcRenderer());

contextBridge.exposeInMainWorld("shell", shell);

contextBridge.exposeInMainWorld("crash", {
  start: () => {
    process.crash();
  },
});
