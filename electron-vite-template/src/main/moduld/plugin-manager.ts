import * as fs from 'fs';
import * as path from 'path';

// 定义插件的接口
interface PluginManifest {
    name: string;
    version: string;
    description: string;
    main: string;              // 插件的入口文件
    pluginType: string;        // 插件类型
    supportedHooks: string[];  // 插件支持的钩子
    author?: string;
    license?: string;
    type?: string;             // 自定义插件的类型（如 bridge）
    match?: string[];          // 匹配规则（如 URL 匹配）
}

// 定义加载的插件结构
interface LoadedPlugin {
    name: string;
    version: string;
    description: string;
    hooks: any;                // 插件导出的钩子函数
    type?: string;             // 插件类型（根据 manifest 中的 type 字段）
    match?: string[];          // 匹配规则
    unload: () => void;
}

// 插件管理类
class PluginManager {
    private pluginDirs: Array<string> = [];           // 插件目录
    private plugins: LoadedPlugin[] = []; // 已加载的插件列表

    constructor() {
    }

    // 加载所有插件
    public loadPlugins(pluginsDir: string) {
        this.pluginDirs.push(pluginsDir);
        const pluginDirs = fs.readdirSync(pluginsDir);
        for (const pluginDir of pluginDirs) {
            const manifestPath = path.join(pluginsDir, pluginDir, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                const manifest = this.loadManifest(manifestPath);
                if (manifest) {
                    const plugin = this.loadPlugin(manifest, pluginsDir, pluginDir);
                    if (plugin) {
                        this.plugins.push(plugin);
                        console.log(`插件 ${plugin.name} 加载成功`);
                    }
                }
            }
        }
    }

    // 加载插件清单文件
    private loadManifest(manifestPath: string): PluginManifest | null {
        try {
            const content = fs.readFileSync(manifestPath, 'utf-8');
            return JSON.parse(content) as PluginManifest;
        } catch (error) {
            console.error(`读取插件清单文件失败: ${manifestPath}`, error);
            return null;
        }
    }

    // 加载插件入口文件
    private loadPlugin(manifest: PluginManifest, pluginsDir: string, pluginDir: string): LoadedPlugin | null {
        const pluginEntryPath = path.join(pluginsDir, pluginDir, manifest.main);
        if (!fs.existsSync(pluginEntryPath)) {
            console.error(`插件入口文件不存在: ${pluginEntryPath}`);
            return null;
        }

        try {
            // 动态加载插件入口文件
            const pluginHooks = require(pluginEntryPath);  // 或使用 import(pluginEntryPath) 来加载模块
            return {
                name: manifest.name,
                version: manifest.version,
                description: manifest.description,
                hooks: pluginHooks,
                type: manifest.type,
                match: manifest.match,
                unload: function () {
                    // 清除 require.cache 中的模块缓存
                    delete require.cache[require.resolve(pluginEntryPath)];
                    console.log(`插件 ${manifest.name} 已卸载`);
                }
            };
        } catch (error) {
            console.error(`加载插件失败: ${manifest.name}`, error);
            return null;
        }
    }

    // 根据 URL 匹配插件
    public getPluginsByURL(url: string): LoadedPlugin[] {
        return this.plugins.filter((plugin) => {
            if (!plugin.match || plugin.match.length === 0) return false;
            return plugin.match.some((pattern) => this.urlMatch(url, pattern));
        });
    }

    // 简单的 URL 匹配函数（支持简单通配符匹配）
    private urlMatch(url: string, pattern: string): boolean {
        const regex = new RegExp(
            '^' +
            pattern
                .replace(/\*/g, '.*')
                .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&') + '$'
        );
        return regex.test(url);
    }

    // 调用插件中的钩子函数
    public runHook(hookName: string, ...args: any[]) {
        for (const plugin of this.plugins) {
            if (plugin.hooks && typeof plugin.hooks[hookName] === 'function') {
                console.log(`运行插件 ${plugin.name} 中的钩子: ${hookName}`);
                plugin.hooks[hookName](...args);
            }
        }
    }
}

export default new PluginManager();

