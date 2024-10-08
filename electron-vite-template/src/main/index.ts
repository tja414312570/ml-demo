import path from "path";
import pluginManager from "./moduld/plugin-manager";
import { Pluginlifecycle } from "src/type/plugin-lifecycle";

interface MyInterface {
    rnm(): void;
    anotherMethod(): string;
}

// 加载所有插件
pluginManager.loadPlugins('./plugins/');

// 模拟当前 URL 场景（实际中你可以从请求或上下文中获取 URL）
const currentURL = 'https://chat.openai.com/some/path';

// 获取符合当前 URL 的插件
const matchedPlugins = pluginManager.getPluginsByURL(currentURL);
console.log(`匹配到的插件: ${matchedPlugins.map((p) => p.name).join(', ')}`);

// 运行指定钩子
pluginManager.runHook('sampleHook');

// pluginManager.unload()