"use strict";
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
  process.exit(1); // 以非零状态码退出程序
});
import { useMainDefaultIpc } from "./services/ipc-main";
import { app, BrowserWindow, dialog, ipcMain, IpcMainEvent, session } from "electron";
import InitWindow from "./services/window-manager";
import { useDisableButton } from "./hooks/disable-button-hook";
import { useProcessException } from "@main/hooks/exception-hook";
import { useMenu } from "@main/hooks/menu-hook"
import { startProxyServer } from "./services/proxy";

import fs, { glob } from "fs"
import { init as ptyInit } from './services/pty'
import { notify } from "./ipc/notify-manager";
import { listeners } from "process";
import pluginContext from '../../lib/src/main/plugin-context'
import pluginManager from "./plugin/plugin-manager";
import path from "path";
import { showErrorDialog } from "./utils/dialog";
import './plugin/ipc-bind'
import { createWindow } from "./services/window-settings";
const innerPluginPath = path.join(__dirname, '../../../plugins');
import './ipc-bind/core-ipc-bind'
console.log(`加载内置插件，位置：${innerPluginPath}`)

app.setName('myApp');
import './services/global-agents'
import './services/service-setting'
function onAppReady() {
  // const { disableF12 } = useDisableButton();
  // const { renderProcessGone } = useProcessException();
  // const { defaultIpc } = useMainDefaultIpc()
  // const { creactMenu } = useMenu()
  // disableF12();
  // renderProcessGone();
  // defaultIpc();
  // creactMenu()

  new InitWindow().initWindow();
  // createWindow();
  if (process.env.NODE_ENV === "development") {
    const { VUEJS_DEVTOOLS } = require("electron-devtools-vendor");
    session.defaultSession.loadExtension(VUEJS_DEVTOOLS, {
      allowFileAccess: true,
    });
    console.log("已安装: vue-devtools");
  }
}
global.userDataPath = app.getPath('userData');
if (fs.existsSync(global.userDataPath)) {
  console.log('配置目录存在:', global.userDataPath);
} else {
  console.log('配置目录不存在:', global.userDataPath);
}
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault(); // 阻止默认行为
  callback(true);  // 忽略证书错误
});
app.whenReady().then(() => {
  const upstreamProxy = {
    host: '127.0.0.1',  // 上游代理服务器的地址
    port: 7890,         // 上游代理服务器的端口
    protocol: 'http:',  // 上游代理协议
    auth: ''            // 如果上游代理需要认证，配置用户名和密码
  };

  onAppReady();
  // startProxyServer(upstreamProxy).then(proxy => {
  //   onAppReady();
  ptyInit()
  pluginManager.loadPluginFromDir(innerPluginPath)
  //   ipcMain.on('notificationAPI-ready', () => {
  //     notify("gpt拦截器已初始化完成！")
  //   })
  // })
});
// 由于9.x版本问题，需要加入该配置关闭跨域问题
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");

app.on("window-all-closed", () => {
  // 所有平台均为所有窗口关闭就退出软件
  app.quit();
});
app.on("browser-window-created", (event: Event,
  window: BrowserWindow) => {
  // 
  console.log("window-created", window);
  window.once("ready-to-show", () => {
    console.log("启动终端")

  });
});


if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.removeAsDefaultProtocolClient("electron-vue-template");
    console.log("由于框架特殊性开发环境下无法使用");
  }
} else {
  app.setAsDefaultProtocolClient("electron-vue-template");
}
