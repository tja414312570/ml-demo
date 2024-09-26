import { ipcMain } from 'electron';

ipcMain.handle('register-command', (event, commandName, callback) => {
  // 注册命令
  commands[commandName] = callback;
});
const unloadPlugin = async (pluginPath) => {
    const pluginPackageJson = await import(`${pluginPath}/package.json`, { assert: { type: 'json' } });
    const pluginMain = await import(`${pluginPath}/${pluginPackageJson.default.main}`);
  
    if (typeof pluginMain.deactivate === 'function') {
      pluginMain.deactivate();  // 调用插件的注销函数
    }
  
    // 注意：ES6 模块无法直接删除 require.cache
  };
  
// 使用动态 import 加载插件的主文件
const loadPlugin = async (pluginPath) => {
    const pluginPackageJson = await import(`${pluginPath}/package.json`, { assert: { type: 'json' } });
    const pluginMain = await import(`${pluginPath}/${pluginPackageJson.default.main}`);
  
    if (typeof pluginMain.activate === 'function') {
      pluginMain.activate();  // 调用插件的激活函数
    }
  };
  
  // 假设插件目录为 "plugins"
  const pluginsDir = new URL('./plugins/', import.meta.url);  // ES6 语法下的路径处理
  const fs = await import('fs/promises');
  
  const pluginFolders = await fs.readdir(pluginsDir);
  for (const pluginName of pluginFolders) {
    const pluginPath = new URL(`${pluginName}/`, pluginsDir);
    loadPlugin(pluginPath);
  }
  

  