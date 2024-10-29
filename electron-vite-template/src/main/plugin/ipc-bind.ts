import { ipcMain } from "electron";
import pluginManager from "./plugin-manager";
import _ from 'lodash';  // 使用 ES6 import 语法
import { PluginInfo } from '@lib/main';


const arrayPool = {
    pool: [],  // 存储空闲数组
    maxSize: 5,  // 最大池大小
    index: 0,
    current: 0,
    acquire() {
        if (arrayPool.index > arrayPool.maxSize - 1) {
            arrayPool.index = 0;
        }
        if (arrayPool.pool.length - 1 < arrayPool.index) {
            arrayPool.pool.push([])
        }
        console.log(`池化指针${arrayPool.index}`)
        arrayPool.current = arrayPool.index;
        arrayPool.index++;
        return arrayPool.pool[arrayPool.current];
    }
};

const _clone = (pluginInfo: PluginInfo) => {
    return _.omit(pluginInfo, ['getModule', 'proxy', 'module'])
}
const copy = (pluginList: undefined | null | PluginInfo | Set<PluginInfo>) => {
    if (!pluginList) {
        return null;
    }
    if (typeof pluginList === 'object' && !(pluginList instanceof Set)) {
        return _clone(pluginList);
    }
    const list = arrayPool.acquire();
    list.length = 0;  // 清空数组
    if (pluginList instanceof Set) {
        for (const plugin of pluginList) {
            list.push(_clone(plugin));
        }
        return list;
    }
    return list;
};

ipcMain.handle('plugin-view-api.get-plugin-list', (event, args) => {
    const cloneObj = copy(pluginManager.filtePlugins(args));
    return cloneObj;
})

ipcMain.handle('plugin-view-api.plugin-reload', (event, id: string) => {
    return copy(pluginManager.reload(pluginManager.getPluginFromId(id)));
})