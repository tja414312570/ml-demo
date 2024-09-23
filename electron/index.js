import { app, BrowserWindow, session, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { startProxyServer } from './proxy.js';  // 引入代理逻辑

// 获取当前模块路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.commandLine.appendSwitch('log-net-log', path.join(__dirname, 'net-log.json'));

ipcMain.on('login-info', (event, data) => {
  console.log('Username:', data.username);
  console.log('Password:', data.password);
  // 你可以将数据记录到安全的存储中
});

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        allowRunningInsecureContent: true // 允许不安全内容
    }
  });

  win.webContents.openDevTools();

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
    win.loadURL('https://share.github.cn.com/c/66f0bc12-4778-8007-90ee-5676751dfbbb');
  }).catch((err) => {
    console.error('Failed to set proxy:', err);
  });
};

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    console.log(`Certificate error: ${error} for URL: ${url}`);
    event.preventDefault();  // 阻止默认行为
    callback(true);  // 忽略证书错误并继续加载页面
  });

app.whenReady().then(() => {
     // 启动代理服务器并指定上游代理
  const upstreamProxy = {
    host: '127.0.0.1',  // 上游代理服务器的地址
    port: 7890,         // 上游代理服务器的端口
    protocol: 'http:',  // 上游代理协议
    auth: ''            // 如果上游代理需要认证，配置用户名和密码
  };

  startProxyServer(upstreamProxy);
  createWindow();
});
