import { app, BrowserWindow, session, ipcMain } from 'electron';
import { showErrorDialog } from './utils.js';
const windowManager = global.windowManager  =  {};
const createWindow = (id)=>{
    if(windowManager[id]){
        showErrorDialog(`窗口创建失败`)
        throw new Error(`window id ${id} is exists!`)
    }
    const window = new BrowserWindow({
        width: 400,
        height: 300,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    
    window.loadFile('index.html'); // 加载第二个窗口的 HTML 文件
    
    // 监听第二窗口关闭事件
    window.on('closed', () => {
        windowManager[id] = null
        delete windowManager[id];
    });
    return window;
}
const requiredWindow = (id)=>{
    let window = windowManager[id];
    if(!window){
        window = createWindow(id);
    }
    return window;
}
export{
    createWindow,
    requiredWindow
}