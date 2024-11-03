import { IpcMainEvent, MessageBoxOptions, MessageBoxReturnValue, WebContents, WebFrameMain } from 'electron';
import { Pluginlifecycle } from './plugin-lifecycle';
import { IEvent } from 'node-pty';
import EventEmitter from 'events';

// 定义插件的接口
export interface PluginManifest {
    appId: string;
    name: string;
    version: string;
    description: string;
    main: string;              // 插件的入口文件
    pluginType: string;        // 插件类型
    supportedHooks: string[];  // 插件支持的钩子
    author: string;
    license?: string;
    type: string;             // 自定义插件的类型（如 bridge）
    match?: string[];          // 匹配规则（如 URL 匹配）
    instruct?: string[];      //支持的指令
}

// 定义加载的插件结构
export interface PluginInfo {
    id: string;
    appId: string;
    manifest: any;
    name: string;
    version: string;
    main: string;
    dir: string;
    description: string;
    module: Pluginlifecycle & any;                // 插件导出的钩子函数
    type: PluginType;             // 插件类型（根据 manifest 中的 type 字段）
    match?: string[];          // 匹配规则
    instruct?: string[];       //支持的指令
    status: PluginStatus;
}

export interface PluginProxy {
    proxy: any
    getModule(): any
}

export interface ResourceManager {
    require: <T>(id: string) => Promise<T>;
    put: (id: string, resource: any) => void;
}
export enum ResourceStatus {
    RESOURCE_NOT_FOUND
}
export type ISetting = {
    name: string,
    key: string,
    page?: string,
    path?: string,
    hide?: boolean,
    subs?: Array<ISetting> | null;
}
export interface ISettingManager {
    onSettingChange(path: string, callback: (value: any) => void): void;
    registeSetting(menus: ISetting | ISetting[], path_?: string): void;
    getSettingValue(key: string): Promise<any>;
    saveSettingValue(key: string | Record<string, any>, value?: any): Promise<void>;
    getSettingConfig(): Promise<Record<string, any>>;
    getSettings(path?: string): ISetting[] | ISetting;
}
export interface PluginExtensionContext {
    settingManager: ISettingManager;
    envDir: string;
    resourceManager: ResourceManager;
    _pluginPath: string;
    workPath: string;
    /**
     * 
     * @param plugin 用于获取组件的id
     */
    register(plugin: Pluginlifecycle & any): void;
    /**
     * 用于当组件卸载时主动清理上线文中的钩子
     * @param plugin 
     */
    remove(plugin: Pluginlifecycle & any): void;
    /**
     * 通知管理
     */
    notifyManager: { notify: (message: string) => void, notifyError: (message: string) => void }
    ipcMain: IIpcMain;
    appPath: string

    sendIpcRender: (event_: string, message: any) => void
    showDialog: (message: DialogOpt) => Promise<DialogReturnValue>
}
export type DialogOpt = MessageBoxOptions;
export type DialogReturnValue = MessageBoxReturnValue;

/**
   * An interface representing a pseudoterminal, on Windows this is emulated via the winpty library.
   */
export interface IPty {
    readonly type: string;
    /**
     * The process ID of the outer process.
     */
    readonly pid: number;

    /**
     * The column size in characters.
     */
    readonly cols: number;

    /**
     * The row size in characters.
     */
    readonly rows: number;

    /**
     * The title of the active process.
     */
    readonly process: string;

    /**
     * (EXPERIMENTAL)
     * Whether to handle flow control. Useful to disable/re-enable flow control during runtime.
     * Use this for binary data that is likely to contain the `flowControlPause` string by accident.
     */
    handleFlowControl: boolean;

    /**
     * Adds an event listener for when a data event fires. This happens when data is returned from
     * the pty.
     * @returns an `IDisposable` to stop listening.
     */
    readonly onData: IEvent<string>;

    /**
     * Adds an event listener for when an exit event fires. This happens when the pty exits.
     * @returns an `IDisposable` to stop listening.
     */
    readonly onExit: IEvent<{ exitCode: number, signal?: number }>;

    /**
     * Resizes the dimensions of the pty.
     * @param columns The number of columns to use.
     * @param rows The number of rows to use.
     */
    resize(columns: number, rows: number): void;

    /**
     * Clears the pty's internal representation of its buffer. This is a no-op
     * unless on Windows/ConPTY. This is useful if the buffer is cleared on the
     * frontend in order to synchronize state with the backend to avoid ConPTY
     * possibly reprinting the screen.
     */
    clear(): void;

    /**
     * Writes data to the pty.
     * @param data The data to write.
     */
    write(data: string): void;

    /**
     * Kills the pty.
     * @param signal The signal to use, defaults to SIGHUP. This parameter is not supported on
     * Windows.
     * @throws Will throw when signal is used on Windows.
     */
    kill(signal?: string): void;

    /**
     * Pauses the pty for customizable flow control.
     */
    pause(): void;

    /**
     * Resumes the pty for customizable flow control.
     */
    resume(): void;
}
export interface IIpcMain {

    /**
     * Adds a handler for an `invoke`able IPC. This handler will be called whenever a
     * renderer calls `ipcRenderer.invoke(channel, ...args)`.
     *
     * If `listener` returns a Promise, the eventual result of the promise will be
     * returned as a reply to the remote caller. Otherwise, the return value of the
     * listener will be used as the value of the reply.
     *
     * The `event` that is passed as the first argument to the handler is the same as
     * that passed to a regular event listener. It includes information about which
     * WebContents is the source of the invoke request.
     *
     * Errors thrown through `handle` in the main process are not transparent as they
     * are serialized and only the `message` property from the original error is
     * provided to the renderer process. Please refer to #24427 for details.
     */
    handle(channel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => (Promise<any>) | (any)): void;
    /**
     * Handles a single `invoke`able IPC message, then removes the listener. See
     * `ipcMain.handle(channel, listener)`.
     */
    handleOnce(channel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => (Promise<any>) | (any)): void;
    /**
     * Listens to `channel`, when a new message arrives `listener` would be called with
     * `listener(event, args...)`.
     */
    on(channel: string, listener: (event: IpcMainEvent, ...args: any[]) => void): this;
    /**
     * Adds a one time `listener` function for the event. This `listener` is invoked
     * only the next time a message is sent to `channel`, after which it is removed.
     */
    once(channel: string, listener: (event: IpcMainEvent, ...args: any[]) => void): this;
    /**
     * Removes listeners of the specified `channel`.
     */
    removeAllListeners(channel?: string): this;
    /**
     * Removes any handler for `channel`, if present.
     */
    removeHandler(channel: string): void;
    /**
     * Removes the specified `listener` from the listener array for the specified
     * `channel`.
     */
    removeListener(channel: string, listener: (...args: any[]) => void): this;
}

export interface IpcMainInvokeEvent extends Event {

    // Docs: https://electronjs.org/docs/api/structures/ipc-main-invoke-event

    /**
     * The ID of the renderer frame that sent this message
     */
    frameId: number;
    /**
     * The internal ID of the renderer process that sent this message
     */
    processId: number;
    /**
     * Returns the `webContents` that sent the message
     */
    sender: WebContents;
    /**
     * The frame that sent this message
     *
     */
    readonly senderFrame: WebFrameMain;
}
export enum PluginType {
    agent = 'agent',
    executor = 'executor'
}

export enum PluginStatus {
    ready = 'ready', load = 'load', unload = 'unload', disable = 'disable'
}