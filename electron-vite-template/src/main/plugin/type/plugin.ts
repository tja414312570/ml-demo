import { Pluginlifecycle } from './plugin-lifecycle';

// 定义插件的接口
export interface PluginManifest {
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
}

// 定义加载的插件结构
export interface PluginInfo {
    id: string
    manifest: any;
    name: string;
    version: string;
    main: string;
    dir: string;
    description: string;
    module: Pluginlifecycle & any;                // 插件导出的钩子函数
    type: PluginType;             // 插件类型（根据 manifest 中的 type 字段）
    match?: string[];          // 匹配规则
    status: PluginStatus;
}

export interface PluginProxy {
    proxy: any
    getModule(): any
}


export interface PluginExtensionContext {
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
    notifyManager:{notify:(message:string)=>void,notifyError:(message:string)=>void}
}

export enum PluginType {
    bridge = 'bridge',
    executor = 'executor'
}

export enum PluginStatus {
    ready = 'ready', load = 'load', unload = 'unload', disable = 'disable'
}