import path from "path";
import pluginManager from "./plugin/plugin-manager";

import { Pluginlifecycle } from "@main/plugin/type/plugin-lifecycle";
import { PluginInfo } from "./plugin/type/plugin";
import pluginContext from "./plugin/plugin-context";
import * as fs from 'fs'


pluginManager.setContext(pluginContext)

pluginManager.loadPluginFromDir(path.join(__dirname, '../../../plugins'))
// 加载所有插件
let pluginInfo: PluginInfo = [...pluginManager.getAllPlugins()][0];
console.log(`获取插件1:` + pluginInfo.name)
pluginInfo = pluginManager.getPluginFromId(pluginInfo.id);
console.log(`获取插件2:` + pluginInfo.name)
const plugins: Set<PluginInfo> = pluginManager.getPluginsFromType(pluginInfo.type);
console.log(`获取插件3:` + JSON.stringify([...plugins]))
const module: any = pluginInfo.getModule();
module.onResponse("来自组件")

pluginInfo.unload()

// 模拟当前 URL 场景（实际中你可以从请求或上下文中获取 URL）
// const currentURL = 'https://chat.openai.com/some/path';

// 获取符合当前 URL 的插件
// const matchedPlugins = pluginManager.getPluginsByURL(currentURL);
// console.log(`匹配到的插件: ${matchedPlugins.map((p) => p.name).join(', ')}`);
// pluginManager.unload()