import { contextBridge, ipcMain, ipcRenderer, IpcRendererEvent, shell } from "electron";
import { onUnmounted } from "vue";
import { IpcChannelMainClass, IpcChannelRendererClass } from "../ipc/index";
import { CodeContent } from "@main/ipc/code-manager";

const invokers: { [key: string]: { [key: string]: (event: any, data: any) => void } } = {};
const bindListener = (_id_: string, channel: string, listener: any) => {
  if (!invokers[_id_]) {
    invokers[_id_] = {}
  }
  invokers[_id_][channel] = listener
}
const removeListener = (_id_) => {
  if (!_id_) {
    alert("注销监听器失败，请使用Ipc-Api调用，并传递参数() => {}")
    console.error(new Error("注销监听器失败，请使用代理，并传递参数() => {}"))
    return;
  }
  console.log("注销监听:", _id_)
  if (invokers[_id_]) {
    for (const key in invokers[_id_]) {
      if (invokers[_id_].hasOwnProperty(key)) {
        const listener = invokers[_id_][key];
        ipcRenderer.off(key, listener);  // 移除监听器
        console.log(`Listener for ${key} on ${key} removed`);
      }
    }
  }
}
function isListener(args: any[]) {
  return args.some(arg => typeof arg === 'function');;
}

const ipcRenderMapper = {
  _id_: undefined,
  _setId_: (call: string | Function) => {
    if (typeof call === 'function')
      ipcRenderMapper._id_ = call();
    else
      ipcRenderMapper._id_ = call;
  },
  on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void): IpcRenderer => {
    console.log("监听器：", channel)
    bindListener(ipcRenderMapper._id_, channel, listener)
    return ipcRenderer.on(channel, listener);
  },
  off: () => {
    removeListener(ipcRenderMapper._id_)
  }
}
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

contextBridge.exposeInMainWorld('ipcRenderer', {
  _setId_: ipcRenderMapper._setId_,
  off: ipcRenderMapper.off,
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
