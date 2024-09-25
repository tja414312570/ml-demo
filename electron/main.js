import { app, BrowserWindow, session, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { startProxyServer } from './proxy.js';  // 引入代理逻辑

import { promises as fs } from 'fs'; 

import { notifyApp, notifyAppError } from './bridge.js';
import { showErrorDialog } from './utils.js';

import { requiredWindow } from './window_manager.js';

// 获取当前模块路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// app.disableHardwareAcceleration();


app.commandLine.appendSwitch('log-net-log', path.join(__dirname, 'net-log.json'));

ipcMain.on('login-info', (event, data) => {
  console.log('Username:', data.username);
  console.log('Password:', data.password);
  // 你可以将数据记录到安全的存储中
});


async function injectScripts(win) {
  try {
      // 获取当前目录并构造 JavaScript 文件路径
      const currentDir = __dirname;
      const scriptPath = path.join(currentDir, "bridge/js_bridge.js");

      // 读取 JavaScript 文件内容
      const jsContent = await fs.readFile(scriptPath, { encoding: 'utf-8' });

      // 将 JavaScript 注入到页面中
      await win.webContents.executeJavaScript(jsContent);
      console.log("JavaScript 注入完成");
      // while(!await bridgeCompleted(win)){
      //   console.log("等待初始化")
      // }
      // notifyApp("通知数据")
      // notifyAppError("通知错误")
  } catch (error) {
      console.error("注入 JavaScript 时出错: ", error);
  }
}


async function monitorAndInjectScripts(win) {
  // 初始加载时注入脚本
  await injectScripts(win);

  // 监听页面的 load 事件，检测页面刷新并重新注入脚本
  win.webContents.on('did-finish-load', async () => {
      await injectScripts(win);
  });

  // 可选：检测 DOM 内容加载时也重新注入脚本
  win.webContents.on('dom-ready', async () => {
      await injectScripts(win);
  });
}
const bridgeCompleted = (win)=>{
  return win.webContents.executeJavaScript(`
    (function() {
        return !!(document.myApp && document.myApp.vueInstance);
    })();
`)
}
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 970,
    webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false, // 禁用安全策略
        preload: path.join(__dirname, 'preload.js'),
        allowRunningInsecureContent: true // 允许不安全内容
    }
    
  });
  global.window = win;
  win.webContents.openDevTools();
  monitorAndInjectScripts(win);
  // 设置代理
  const ses = win.webContents.session;
  const currentSession = session.defaultSession;
  currentSession.clearCache().then(() => {
    console.log('Cache cleared successfully.');
  });
  
  // 清除存储的SSL证书错误状态
  currentSession.clearAuthCache().then(() => {
    console.log('Auth cache cleared successfully.');
  });
 
  ses.setProxy({
    proxyRules: '127.0.0.1:3001',
    proxyBypassRules: 'localhost'
  }).then(() => {
    console.log('Proxy is set successfully');
    win.loadURL('https://chat.openai.com/');
    // win.loadFile("views/index.html")
  }).catch((err) => {
    console.error('Failed to set proxy:', err);
  });
};

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    console.log(`Certificate error: ${error} for URL: ${url}`);
    event.preventDefault();  // 阻止默认行为
    callback(true);  // 忽略证书错误并继续加载页面
  });
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.whenReady().then(() => {
  session.defaultSession.setCertificateVerifyProc((request, callback) => {
    // 不进行任何证书验证，返回 true
    callback(0); // 0 表示信任证书
});
     // 启动代理服务器并指定上游代理
  const upstreamProxy = {
    host: '127.0.0.1',  // 上游代理服务器的地址
    port: 7890,         // 上游代理服务器的端口
    protocol: 'http:',  // 上游代理协议
    auth: ''            // 如果上游代理需要认证，配置用户名和密码
  };
  startProxyServer(upstreamProxy).then(proxy=>{
    createWindow()
    // requiredWindow("code")
  }).catch(err=>{
    console.error(err)
    showErrorDialog("代理未启动成功")
  })
});
