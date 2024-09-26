import { app, BrowserWindow, session, ipcMain } from 'electron';
import { showErrorDialog } from './utils.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { notifyApp, notifyAppError } from './bridge.js';

// 获取当前模块路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const windowManager = global.windowManager  =  {};
const createWindow = (id)=>{
    if(windowManager[id]){
        showErrorDialog(`窗口创建失败`)
        throw new Error(`window id ${id} is exists!`)
    }
    const window = new BrowserWindow({
        width: 1280,
        height: 760,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            devTools:true,
            preload: path.join(__dirname, 'views/preload.mjs'),
        },
    });
    window.webContents.openDevTools();
    window.loadFile('views/index.html'); // 加载第二个窗口的 HTML 文件
    let i = 1;
    window.sendCode = (code)=>{
        // notifyApp(`发送代码:${id}`)
        window.webContents.send('code', code)
    }
    setInterval(()=>{
        window.sendCode("var i = j;")
    },1000)
    // 监听第二窗口关闭事件
    window.on('closed', () => {
        windowManager[id] = null
        delete windowManager[id];
    });
    return window;
}
const requiredWindow = (id)=>{
    let window = windowManager[id];
    notifyApp(`打开窗口:${id}`)
    if(!window){
        windowManager[id] = window;
        window = createWindow(id);
    }
    return window;
}
export{
    createWindow,
    requiredWindow
}