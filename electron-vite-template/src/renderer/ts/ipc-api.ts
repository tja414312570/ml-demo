import { v4 as uuidv4 } from 'uuid';

class IpcApi {
    private uuid: string;
    private channel: string;
    private ipcApi: any;

    constructor(channel: string) {
        this.uuid = uuidv4();  // 生成 UUID
        this.channel = channel;  // 初始化 channel
        if (!window[channel]) {
            alert("没有找到渠道:" + channel);
        }
        this.ipcApi = window[channel]
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

// getIpcApi 函数，用于创建带有代理的 IpcApi 对象
export function getIpcApi(channel: string): IpcApi {
    const ipcApiInstance = new IpcApi(channel);
    const { _getIpcApi__, _getId__ } = ipcApiInstance;

    // 使用 Proxy 创建代理
    return new Proxy(ipcApiInstance, {
        get(target, prop) {
            if (prop in target) {
                // 如果方法存在，则调用原始对象的方法
                return target[prop];
            } else {
                // 如果方法不存在，输出调用的方法名并返回一个默认值
                return (...args: any[]) => {
                    try {
                        _getIpcApi__()._setId_(_getId__());
                        const result = _getIpcApi__()[prop](...args);  // 可以根据需求返回其他默认值
                        return result;
                    } finally {
                        _getIpcApi__()._setId_(undefined);
                    }
                };
            }
        }
    });
}
function isListener(args: any[]) {
    return args.some(arg => typeof arg === 'function');;
}

