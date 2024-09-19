import { app, BrowserWindow, session, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { startProxyServer } from './proxy.js';  // 引入代理逻辑

// 获取当前模块路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.webContents.openDevTools();

  // 设置代理
  const ses = win.webContents.session;
  ses.setProxy({
    proxyRules: 'http=127.0.0.1:3000;https=127.0.0.1:3000',
    proxyBypassRules: 'localhost'
  }).then(() => {
    console.log('Proxy is set successfully');
    win.loadURL('https://share.github.cn.com/');
  }).catch((err) => {
    console.error('Failed to set proxy:', err);
  });
};

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);  // 忽略证书错误，仅用于开发环境
});

app.whenReady().then(() => {
  createWindow();

  // 启动代理服务器并指定上游代理
  const upstreamProxy = {
    host: '127.0.0.1',  // 上游代理服务器的地址
    port: 7890,         // 上游代理服务器的端口
    protocol: 'http:',  // 上游代理协议
    auth: ''            // 如果上游代理需要认证，配置用户名和密码
  };

  startProxyServer(upstreamProxy);
});
