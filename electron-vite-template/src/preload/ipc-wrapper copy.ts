import { contextBridge, IpcRenderer, ipcRenderer, IpcRendererEvent } from "electron";

const invokers: { [key: string]: { [key: string]: (event: any, data: any) => void } } = {};
const bindListener = (_id_: string, channel: string, listener: any) => {
  if (!invokers[_id_]) {
    invokers[_id_] = {}
  }
  invokers[_id_][channel] = listener
}
const removeListener = (_id_: string, channel: string) => {
  if (invokers[_id_]) {
    delete invokers[_id_][channel]
    if (Object.keys(invokers[_id_]).length === 0) {
      delete invokers[_id_];
    }
  }
}
const onReady = (): Promise<number> => {

  return new Promise<number>((resolve, rejects) => {
    if (ipcRenderMapper._web_content_id_) {
      resolve(ipcRenderMapper._web_content_id_)
      return;
    }
    ipcRenderer.invoke('ipc-core.get-current-webcontents-id').then(webContentId => {
      console.log(`获取当前的进程信息：${webContentId}`)
      resolve(webContentId)
    }).catch(err => {
      console.error("获取进程失败：", err)
      rejects(err)
    })
  })
}

interface IpcRendererExtended extends IpcRenderer {
  _id_?: string | undefined;
  _web_content_id_?: number | undefined;
  _setId_: (call: string | Function) => void;
  off: (channel: string) => this;
  offAll: () => void;
}

const _web_content_id_: string = null;

class IpcReanderMapper implements IpcRendererExtended {
  _channel_: string;
  _id_;
  constructor(_channel: string) {
    this._channel_ = _channel;
  }
  _setId_(call: string | Function) {
    if (typeof call === 'function')
      this._id_ = call();
    else
      this._id_ = call;
  }
  on(channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) {
    if (!this._id_) {
      alert("绑定监听器失败，请使用Ipc-Api调用")
      console.error(new Error("注销监听器失败，请使用代理"))
      return;
    }
    // 获
    console.log("绑定监听器：", channel)
    const wrappedListener = (event: IpcRendererEvent, ...args: any[]) => {
      try {
        listener(event, ...args);
      } catch (error) {
        console.error(`监听器 '${channel}' 执行出错:`, error);
        alert(`监听器 '${channel}' 执行出错:${String(error)}`)
        // 你可以在这里添加自定义的错误处理，例如发送通知或日志记录
      }
    };
    bindListener(this._id_, channel, wrappedListener)
    ipcRenderer.send('ipc-core.bind-channel-listener', { webContentId: _web_content_id_, channel })
    ipcRenderer.on(channel, wrappedListener)
    return this;
  }
  offAll() {
    if (!this._id_) {
      alert("注销监听器失败，请使用Ipc-Api调用，并传递参数")
      console.error(new Error("注销监听器失败，请使用代理，并传递参数"))
      return;
    }
    console.log("注销监听:", this._id_)
    if (invokers[this._id_]) {
      for (const channel in invokers[this._id_]) {
        const listener = invokers[this._id_][channel];
        console.log("注销监听:", this._id_, listener)
        ipcRenderer.off(channel, listener);
        removeListener(this._id_, channel)
        ipcRenderer.send('ipc-core.remove-channel-listener', { webContentId: _web_content_id_, channel })
        console.log(`Listener for ${channel} on ${channel} removed`);
      }
    }
  }
  off(channel: string) {
    if (!this._id_) {
      alert("注销监听器失败，请使用Ipc-Api调用，并传递参数")
      console.error(new Error("注销监听器失败，请使用代理，并传递参数"))
      return;
    }
    if (channel) {
      alert("注销监听器失败，请传入要解绑的渠道")
      console.error(new Error("注销监听器失败，请使用代理，并传递参数"))
      return;
    }
    console.log("注销监听:", this._id_)
    const listener = invokers[this._id_][channel];
    ipcRenderer.off(channel, listener);
    removeListener(this._id_, channel)
    ipcRenderer.send('ipc-core.remove-channel-listener', { webContentId: _web_content_id_, channel })
    console.log(`Listener for ${channel} on ${channel} removed`);
    return this;
  }
  addListener(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void): this {
    throw new Error("Method not implemented.");
  }
  invoke(channel: string, ...args: any[]): Promise<any> {
    throw new Error("Method not implemented.");
  }
  once(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void): this {
    throw new Error("Method not implemented.");
  }
  postMessage(channel: string, message: any, transfer?: MessagePort[]): void {
    throw new Error("Method not implemented.");
  }
  removeAllListeners(channel: string): this {
    throw new Error("Method not implemented.");
  }
  removeListener(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void): this {
    throw new Error("Method not implemented.");
  }
  send(channel: string, ...args: any[]): void {
    throw new Error("Method not implemented.");
  }
  sendSync(channel: string, ...args: any[]) {
    throw new Error("Method not implemented.");
  }
  sendToHost(channel: string, ...args: any[]): void {
    throw new Error("Method not implemented.");
  }
  setMaxListeners(n: number): this {
    throw new Error("Method not implemented.");
  }
  getMaxListeners(): number {
    throw new Error("Method not implemented.");
  }
  listeners<K>(eventName: string | symbol): Function[] {
    throw new Error("Method not implemented.");
  }
  rawListeners<K>(eventName: string | symbol): Function[] {
    throw new Error("Method not implemented.");
  }
  emit<K>(eventName: string | symbol, ...args: any[]): boolean {
    throw new Error("Method not implemented.");
  }
  listenerCount<K>(eventName: string | symbol, listener?: Function): number {
    throw new Error("Method not implemented.");
  }
  prependListener<K>(eventName: string | symbol, listener: (...args: any[]) => void): this {
    throw new Error("Method not implemented.");
  }
  prependOnceListener<K>(eventName: string | symbol, listener: (...args: any[]) => void): this {
    throw new Error("Method not implemented.");
  }
  eventNames(): (string | symbol)[] {
    throw new Error("Method not implemented.");
  }

}

export const ipcRenderMappers: IpcRendererExtended = new Proxy({
  _id_: undefined,
  _web_content_id_: undefined
}, {
  get(target, prop) {
    if (prop in target) {
      return target[prop];
    } else {
      return (...args: any) => ipcRenderer[prop](...args)
    }
  }
}) as any;

const api_wrapoer = {
  _setId_: ipcRenderMapper._setId_,
  off: ipcRenderMapper.off,
  offAll: ipcRenderMapper.offAll,
  on: ipcRenderMapper.on,
  send: ipcRenderer.send,
  invoke: ipcRenderer.invoke
}
export const exposeInMainWorld = (channel: string, api: { [key: string]: any }) => {
  return new Promise<void>((resolve, rejects) => {
    onReady().then((webContentId: number) => {
      console.log("准备暴露进程", webContentId)
      ipcRenderMapper._web_content_id_ = webContentId;
      const wrrpperApi = { ...api_wrapoer, ...api }
      contextBridge.exposeInMainWorld(channel, wrrpperApi);
      resolve();
    }).catch(err => {
      rejects(err)
    })
  })
}
