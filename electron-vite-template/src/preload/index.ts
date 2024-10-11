import { contextBridge, ipcMain, ipcRenderer, IpcRendererEvent, shell } from "electron";
import { onUnmounted } from "vue";
import { IpcChannelMainClass, IpcChannelRendererClass } from "../ipc/index";
import { InstructContent } from "@main/ipc/code-manager";
import { exposeInMainWorld, ipcRenderMapper } from "./ipc-wrapper";
import './index-plugin-view'
// const wrapper = (api: any) => {
//   return new Proxy(api, {
//     get(target, prop) {
//       return (...args: any[]) => {
//         if (isListener(args)) {
//           bindListener(args[0],)
//         }
//         return target[prop](...args);  // 可以根据需求返回其他默认值
//       };
//     }
//   });

// }

exposeInMainWorld('core-api', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, listener) => {
    if (typeof listener === 'function') {
      // bindListener(_id_, channel, listener)
      ipcRenderMapper.on(channel, listener);
      onUnmounted(() => ipcRenderer.off(channel, listener))
    } else {
      console.error(`The callback provided to ipcRenderer.on for channel "${channel}" is not a function.`);
    }
  },
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  //  off: ipcRenderMapper.off
});

exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, listener) => {
    if (typeof listener === 'function') {
      // bindListener(_id_, channel, listener)
      ipcRenderMapper.on(channel, listener);
      onUnmounted(() => ipcRenderer.off(channel, listener))
    } else {
      console.error(`The callback provided to ipcRenderer.on for channel "${channel}" is not a function.`);
    }
  },
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  //  off: ipcRenderMapper.off
});


contextBridge.exposeInMainWorld('codeViewApi', {
  onCode: (callback: Function) => ipcRenderer.on('codeViewApi.code', (event, notifyData) => {
    callback(notifyData);
  }),
  executeCode: (code: InstructContent) => ipcRenderer.invoke("codeViewApi.execute", code),
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
