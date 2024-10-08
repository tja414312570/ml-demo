import * as fs from 'fs';
import * as path from 'path';
import { PluginExtensionContext, PluginInfo, PluginManifest, PluginType } from './type/plugin';
import assert from 'assert';
import { v4 as uuidv4 } from 'uuid';
import { MapSet } from '../utils/MapSet';

const manifest_keys: Array<string> = ['name', 'main', 'version', 'description', 'author']
// 插件管理类
class PluginManager {
    private pluginDirs: Set<string> = new Set();           // 插件目录
    private pluginSet: Set<PluginInfo> = new Set(); // 已加载的插件列表
    private ctx: PluginExtensionContext;
    private idMapping: { [key: string]: PluginInfo } = {}
    private typeMapping: MapSet<PluginInfo> = new MapSet();
    constructor() {

    }
    public setContext(ctx: PluginExtensionContext) {
        this.ctx = ctx;
    }
    add(pluginInfo: PluginInfo) {
        this.idMapping[pluginInfo.id] = pluginInfo;
        this.pluginSet.add(pluginInfo);
        this.typeMapping.add(pluginInfo.type, pluginInfo)
    }
    remove(pluginInfo: PluginInfo) {
        this.pluginSet.delete(pluginInfo)
        delete this.idMapping[pluginInfo.id];
        this.typeMapping.remove(pluginInfo.type, pluginInfo)
    }
    public getPluginsFromType(type: PluginType): Set<PluginInfo> | undefined | null {
        return this.typeMapping.get(type);
    }
    public getAllPlugins(): Set<PluginInfo> {
        return this.pluginSet;
    }
    public getPluginFromId(id: string): PluginInfo {
        return this.idMapping[id];
    }
    private wrapperModule(instance: any, pluginInfo: PluginInfo) {
        return new Proxy(instance, {
            get(target, prop) {
                if (prop === "toJSON" || prop in target) {
                    // 如果方法存在，则调用原始对象的方法
                    return target[prop];
                } else {
                    throw new Error(`组件${pluginInfo.name}不存在方法或属性'${String(prop)}'`)
                }
            }
        });
    }
    public loadPlugin(plugin_path: string, strict = true) {
        assert(this.ctx, `加载组件前请先设置上下文`)
        assert.ok(fs.existsSync(plugin_path), `插件目录不存在:${plugin_path}`)
        const manifestPath = path.join(plugin_path, 'manifest.json');
        if (!strict) {
            if (!fs.existsSync(manifestPath)) {
                console.warn(`插件清单文件不存在，请检查此目录是否为插件目录:${manifestPath}`)
                return;
            }
        } else {
            assert.ok(fs.existsSync(manifestPath), `插件清单文件不存在，请检查此目录是否为插件目录:${plugin_path}`)
        }
        const manifest = this.loadManifest(manifestPath);
        const pluginMain = path.join(plugin_path, manifest.main);
        assert.ok(fs.existsSync(plugin_path), `插件入口文件不存在: ${pluginMain}`)
        const _this = this;
        // 动态加载插件入口文件
        const pluginInfo: PluginInfo = {
            id: uuidv4(),
            manifest: manifest,
            name: manifest.name,
            main: pluginMain,
            dir: plugin_path,
            version: manifest.version,
            description: manifest.description,
            module: null,
            type: manifest.type as any,
            match: manifest.match,
            load: () => {
                const orgin = require(pluginInfo.main);
                assert.ok(orgin.default, `插件${manifest.name}的入口文件没有提供默认导出,文件位置:${pluginMain}`)
                assert.ok(typeof orgin.default === 'object' && orgin.default !== null, `插件${manifest.name}的入口文件导出非对象,文件位置:${pluginMain}`)
                pluginInfo.module = this.wrapperModule(orgin.default, pluginInfo); // 或使用 import(pluginEntryPath) 来加载模块
                this.ctx.register(pluginInfo);
                pluginInfo.module.onMounted(this.ctx);
            },
            unload: () => {
                if (!module) {
                    return;
                }
                pluginInfo.module.onUnmounted(this.ctx);
                this.ctx.remove(pluginInfo);
                this.remove(pluginInfo)
                // 清除 require.cache 中的模块缓存
                delete require.cache[require.resolve(pluginInfo.main)];
                console.log(`插件 ${manifest.name} 已卸载`);
            },
            getModule: function (): void {
                if (!pluginInfo.module) {
                    pluginInfo.load()
                }
                return pluginInfo.module;
            }
        };
        this.add(pluginInfo)
        console.log(`已加载插件信息,名称：${pluginInfo.name}，类型：${pluginInfo.type},位置:${pluginInfo.dir},主程序文件：${manifest.main}`)
        return pluginInfo;
    }

    // 加载所有插件
    public loadPluginFromDir(pluginsDir: string) {
        this.pluginDirs.add(pluginsDir);
        const pluginDirs = fs.readdirSync(pluginsDir);
        for (const childDir of pluginDirs) {
            this.loadPlugin(path.join(pluginsDir, childDir), false)
        }
    }
    // 加载插件清单文件
    private loadManifest(manifestPath: string): PluginManifest | null {
        const content = fs.readFileSync(manifestPath, 'utf-8');
        const manifestInfo = JSON.parse(content) as PluginManifest;
        // 检查 manifestInfo 中是否包含所有必需的键
        const missingKeys = manifest_keys.filter(key => !manifestInfo.hasOwnProperty(key));
        // 使用 assert 断言检查所有键是否存在
        assert.ok(missingKeys.length === 0, `清单文件至少包含 ${JSON.stringify(manifest_keys)} 属性，但缺少以下属性: ${JSON.stringify(missingKeys)}`);
        return manifestInfo;
    }

    // // 根据 URL 匹配插件
    // public getPluginsByURL(url: string): PluginInfo[] {
    //     return this.plugins.filter((plugin) => {
    //         if (!plugin.match || plugin.match.length === 0) return false;
    //         return plugin.match.some((pattern) => this.urlMatch(url, pattern));
    //     });
    // }

    // // 简单的 URL 匹配函数（支持简单通配符匹配）
    // private urlMatch(url: string, pattern: string): boolean {
    //     const regex = new RegExp(
    //         '^' +
    //         pattern
    //             .replace(/\*/g, '.*')
    //             .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&') + '$'
    //     );
    //     return regex.test(url);
    // }
}

export default new PluginManager();

