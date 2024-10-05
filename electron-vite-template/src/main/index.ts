"use strict";

import { useMainDefaultIpc } from "./services/ipc-main";
import { app, session } from "electron";
import InitWindow from "./services/window-manager";
import { useDisableButton } from "./hooks/disable-button-hook";
import { useProcessException } from "@main/hooks/exception-hook";
import { useMenu } from "@main/hooks/menu-hook"
import { startProxyServer } from "./services/proxy";

import fs from "fs"

app.setName('myApp');

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
app.whenReady().then(()=>{
  const upstreamProxy = {
    host: '127.0.0.1',  // 上游代理服务器的地址
    port: 7890,         // 上游代理服务器的端口
    protocol: 'http:',  // 上游代理协议
    auth: ''            // 如果上游代理需要认证，配置用户名和密码
  };
  startProxyServer(upstreamProxy).then(proxy=>{
    onAppReady();
  })
});
// 由于9.x版本问题，需要加入该配置关闭跨域问题
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");

app.on("window-all-closed", () => {
  // 所有平台均为所有窗口关闭就退出软件
  app.quit();
});
app.on("browser-window-created", () => {
  console.log("window-created");
});

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.removeAsDefaultProtocolClient("electron-vue-template");
    console.log("由于框架特殊性开发环境下无法使用");
  }
} else {
  app.setAsDefaultProtocolClient("electron-vue-template");
}
