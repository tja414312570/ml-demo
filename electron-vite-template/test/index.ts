import path from "path";
import pluginManager from "../src/main/plugin/plugin-manager";

import { PluginInfo, PluginType } from "../src/main/plugin/type/plugin";
import pluginContext from "../src/main/plugin/plugin-context";
import { Bridge } from "../src/main/plugin/type/bridge";


pluginManager.loadPluginFromDir(path.join(__dirname, '../plugins'))
const type = PluginType.bridge;
pluginManager.resolvePluginModule<Bridge>(type).then(module => {
    console.log(`获取插件成功${module}`)
    // module.onResponse("来自组件")
}).catch(err => {
    console.error(`错误:`, err)
})

// 模拟当前 URL 场景（实际中你可以从请求或上下文中获取 URL）
// const currentURL = 'https://chat.openai.com/some/path';

// 获取符合当前 URL 的插件
// const matchedPlugins = pluginManager.getPluginsByURL(currentURL);
// console.log(`匹配到的插件: ${matchedPlugins.map((p) => p.name).join(', ')}`);
// pluginManager.unload()