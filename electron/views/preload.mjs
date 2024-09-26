// 使用 ES6 模块导入
// const { contextBridge, ipcRenderer } = require('electron');
import { contextBridge, ipcRenderer } from 'electron';


// 使用 contextBridge 向渲染进程暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  onCode: (callback) => ipcRenderer.on('code', (_event, value) => callback(value)),
  counterValue: (value) => ipcRenderer.send('counter-value', value)
});
