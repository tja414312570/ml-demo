import { IpcRendererEvent } from 'electron';
import { IpcRenderer } from 'electron/renderer';
import { v4 as uuidv4 } from 'uuid';
function showCustomAlert(message: string) {
    const alertDiv = document.createElement('div');
    alertDiv.innerText = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '10px';
    alertDiv.style.left = '50%';
    alertDiv.style.transform = 'translateX(-50%)';
    alertDiv.style.backgroundColor = 'white';
    alertDiv.style.padding = '10px';
    alertDiv.style.border = '1px solid black';
    alertDiv.style.zIndex = '1000';
    document.body.appendChild(alertDiv);
}

const _win: { [key: string]: any } = (window as any);

class IpcApi {
    private uuid: string;
    private channel: string;
    private ipcApi: any;

    constructor(channel: string) {
        this.uuid = uuidv4();  // 生成 UUID
        this.channel = channel;  // 初始化 channel
        if (!_win[channel]) {
            const message = `IPC-API错误，没有找到渠道:${channel} `
            _win['core-api'].send('error-notify', message)
            showCustomAlert(message)
            throw new Error(message)
        }
        this.ipcApi = _win[channel]
    }
    _getId__ = () => {
        return this.uuid;
    }

    _getChannel__ = () => {
        return this.channel;
    }

    _getIpcApi__ = () => {
        return this.ipcApi;
    }
}

export interface DefaultApi {
    off: (channel: string) => void,
    offAll: () => void,
    on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => IpcRenderer;
    send: (channel: string, ...args: any[]) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
}

// getIpcApi 函数，用于创建带有代理的 IpcApi 对象
export function getIpcApi<T>(channel: string): IpcApi & DefaultApi & T {
    const ipcApiInstance = new IpcApi(channel);
    const { _getIpcApi__, _getId__ } = ipcApiInstance;

    // 使用 Proxy 创建代理
    return new Proxy(ipcApiInstance, {
        get(target, prop) {
            if (prop in target) {
                // 如果方法存在，则调用原始对象的方法
                return (target as any)[prop];
            } else {
                // 如果方法不存在，输出调用的方法名并返回一个默认值
                return (...args: any[]) => {
                    try {
                        // const _channel = channel + '.' + args[0];
                        // const _args = args.slice(1);
                        _getIpcApi__()._setId_(_getId__());
                        const result = _getIpcApi__()[prop](...args);  // 可以根据需求返回其他默认值
                        return result;
                    } catch (err) {
                        const message = `ipc通信异常:${String(err)},目标:${channel}.${String(prop)}`
                        _win['core-api'].send('error-notify', message)
                        showCustomAlert(message)
                        throw new Error(message, { cause: err })
                    } finally {
                        _getIpcApi__()._setId_(undefined);
                    }
                };
            }
        }
    }) as IpcApi & T & DefaultApi;
}
function isListener(args: any[]) {
    return args.some(arg => typeof arg === 'function');;
}

