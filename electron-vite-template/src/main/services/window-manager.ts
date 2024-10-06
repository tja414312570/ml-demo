import config from "@config/index";
import { BrowserWindow, dialog, session, ipcMain } from "electron";
import { winURL, loadingURL, getPreloadFile } from "../config/static-path";
import { useProcessException } from "@main/hooks/exception-hook";
import * as pty from 'node-pty';
import path from "path";
import { CodeContent } from "@main/ipc/code-manager";
import { executeCode } from "./code-executor";


class MainInit {
  public winURL: string = "";
  public shartURL: string = "";
  public loadWindow: BrowserWindow = null;
  public mainWindow: BrowserWindow = null;
  private childProcessGone = null;

  constructor() {
    const { childProcessGone } = useProcessException();
    this.winURL = winURL;
    this.shartURL = loadingURL;
    this.childProcessGone = childProcessGone;
  }
  // 主窗口函数
  createMainWindow() {
    console.log('预加载路径:' + getPreloadFile("index"))
    this.mainWindow = new BrowserWindow({
      titleBarOverlay: {
        color: "#fff",
      },
      titleBarStyle: config.IsUseSysTitle ? "default" : "hidden",
      height: 800,
      useContentSize: true,
      width: 1700,
      minWidth: 1366,
      show: false,
      frame: config.IsUseSysTitle,
      webPreferences: {
        webSecurity: false,
        webviewTag: true,
        // 如果是开发模式可以使用devTools
        devTools: process.env.NODE_ENV === "development",
        // 在macos中启用橡皮动画
        scrollBounce: process.platform === "darwin",
        preload: getPreloadFile("index"),
        allowRunningInsecureContent: true // 允许不安全内容
      },
    });
    global.mainWindow = this.mainWindow;
    console.log("初始化", global.mainWindow);
    const currentSession = session.defaultSession;
    currentSession.clearCache()
      .then(() => {
        console.log('缓存已清除');
      })
      .catch((err) => {
        console.error('清除缓存时出错:', err);
      });

    // 清除存储的SSL证书错误状态
    currentSession.clearAuthCache().then(() => {
      console.log('Auth cache cleared successfully.');
    });

    // 创建 PTY 实例
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env,
    });

    // 监听来自 xterm.js 的输入
    ipcMain.on('terminal-input', (event, input) => {
      ptyProcess.write(input);
    });
    ipcMain.handle('load-script', (event, fileName) => {
      console.log("加载脚本：", fileName, getPreloadFile(fileName))
      return path.join("file://", getPreloadFile(fileName))
    });
    // 将 PTY 输出发送到前端
    ptyProcess.on('data', (data) => {
      this.mainWindow.webContents.send('terminal-output', data);
    });
    ipcMain.on('terminal-into', (event, data) => {
      ptyProcess.write(data);
    });

    ipcMain.handle('codeViewApi.execute', (event, code: CodeContent) => {
      return executeCode(code)
    })
    // 调整终端大小
    ipcMain.on('terminal-resize', (event, cols, rows) => {
      if (cols > 0 && rows > 0) {
        console.log('terminal-resize：', cols, rows);
        ptyProcess.resize(cols, rows);
      } else {
        console.warn('Invalid terminal size:', cols, rows);
      }

    });
    // 加载主窗口
    this.mainWindow.loadURL(this.winURL);
    this.mainWindow.webContents.on('will-attach-webview', (e, webPreferences) => {
      webPreferences.webSecurity = false
      webPreferences.allowRunningInsecureContent = true
      webPreferences.preload = getPreloadFile('webview')
    })

    const ses = session.fromPartition('persist:your-partition');
    // 清理所有存储数据，包括缓存、Cookies、LocalStorage 等
    ses.clearStorageData({
      storages: ["filesystem", "indexdb", "localstorage", "shadercache", "websql", "serviceworkers", "cachestorage"]
    }).then(() => {
      console.log('所有存储数据已清理');
    });
    // ses.cookies.set({
    //   url: 'https://chatgpt.com',
    //   name: 'cf_clearance',
    //   value: 'L_v9JpEHQIqc_67rTr3.6I3WjXQhCbX0Ry8CEhEO_4I-1728131342-1.2.1.1-4nuPoUfRrJV9c2wMNH61FVQu1p40XeOECzf8KgZXDyfmmwXfIhdyfV53_UGAPw_ft1uss8ptzgvRedtgK._wM3I6KFOdK894fUxech.JCDlNaOV2L.4N7aUvyymdDNoRdc7twfs3yFzvPgOTanaEaZQ2RCxW7dwpamI.lX5R9t3_QTa6Ah1EYDobucTx8fwiFLRJVLnd5KwKR6w3pgg72vhuVMN0UoJaykWAj2aGC6DzZKxlXQRe_5bouBjnpltDweRo1OxMt7wqWg9whoFgz2Uz4ggrqzkjZLv3hFOYQ2FtgaHYoRVTr7R6yz82Er7H2g.qOncbQQnGb5Zurf_k5P_NU2MYQUW_3_M5fDqm3YDdNbN9J9FPXB4W8UpoTIbEvsyqnp9SUYB4wirHGkMrqkXadXmfSQuAYY.MN9uHXmzxFwlsu3E9djx7hrCSr9Ve' // 将浏览器中的有效 cf_clearance Cookie 值填入
    // }).then(() => {
    //   console.log('Cloudflare clearance cookie 已设置');
    // });

    ses.webRequest.onHeadersReceived((details, callback) => {
      delete details.responseHeaders['content-security-policy']
      callback({ responseHeaders: details.responseHeaders });
    })


    // 设置其他关键请求头
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      // 设置所有请求头
      // details.requestHeaders['accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';
      // details.requestHeaders['accept-encoding'] = 'gzip, deflate, br, zstd';
      // details.requestHeaders['accept-language'] = 'zh-CN,zh;q=0.9';
      // details.requestHeaders['cache-control'] = 'max-age=0';
      // details.requestHeaders['connection'] = 'keep-alive';

      // // 设置你的 Cookie
      // // details.requestHeaders['cookie'] = '__Host-next-auth.csrf-token=61275f74c312e5c7608a13747711f24eda4f8d5e37218f25fb1c564c1dc6f6f8%7C838e23860313a0d5e3db418ebd06f08d787ffb84bbe7f2bdb5d0bd9325f67cbf; __Secure-next-auth.callback-url=https%3A%2F%2Fchat-onramp.unified-7.api.openai.com; oai-did=5ad58223-1567-4f35-8dc9-c574cd1b9711; _cfuvid=xvP9756bGKXKDqWWU_rL1pxJZ47yCOIwGtUjQs94hKQ-1728131341691-0.0.1.1-604800000; oai-nav-state=1; cf_clearance=L_v9JpEHQIqc_67rTr3.6I3WjXQhCbX0Ry8CEhEO_4I-1728131342-1.2.1.1-4nuPoUfRrJV9c2wMNH61FVQu1p40XeOECzf8KgZXDyfmmwXfIhdyfV53_UGAPw_ft1uss8ptzgvRedtgK._wM3I6KFOdK894fUxech.JCDlNaOV2L.4N7aUvyymdDNoRdc7twfs3yFzvPgOTanaEaZQ2RCxW7dwpamI.lX5R9t3_QTa6Ah1EYDobucTx8fwiFLRJVLnd5KwKR6w3pgg72vhuVMN0UoJaykWAj2aGC6DzZKxlXQRe_5bouBjnpltDweRo1OxMt7wqWg9whoFgz2Uz4ggrqzkjZLv3hFOYQ2FtgaHYoRVTr7R6yz82Er7H2g.qOncbQQnGb5Zurf_k5P_NU2MYQUW_3_M5fDqm3YDdNbN9J9FPXB4W8UpoTIbEvsyqnp9SUYB4wirHGkMrqkXadXmfSQuAYY.MN9uHXmzxFwlsu3E9djx7hrCSr9Ve; _dd_s=isExpired=1';

      // // details.requestHeaders['host'] = 'chatgpt.com';

      // // 设置 sec-ch-ua 系列
      // details.requestHeaders['sec-ch-ua'] = '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"';
      // details.requestHeaders['sec-ch-ua-arch'] = '"x86"';
      // details.requestHeaders['sec-ch-ua-bitness'] = '"64"';
      // details.requestHeaders['sec-ch-ua-full-version'] = '"129.0.6668.70"';
      // details.requestHeaders['sec-ch-ua-full-version-list'] = '"Google Chrome";v="129.0.6668.70", "Not=A?Brand";v="8.0.0.0", "Chromium";v="129.0.6668.70"';
      // details.requestHeaders['sec-ch-ua-mobile'] = '?0';
      // details.requestHeaders['sec-ch-ua-model'] = '""';
      // details.requestHeaders['sec-ch-ua-platform'] = '"macOS"';
      // details.requestHeaders['sec-ch-ua-platform-version'] = '"13.6.0"';

      // // 设置 sec-fetch 系列
      // details.requestHeaders['sec-fetch-dest'] = 'document';
      // details.requestHeaders['sec-fetch-mode'] = 'navigate';
      // details.requestHeaders['sec-fetch-site'] = 'none';
      // details.requestHeaders['sec-fetch-user'] = '?1';

      // // 其他请求头
      // details.requestHeaders['upgrade-insecure-requests'] = '1';

      // // 设置 user-agent
      // details.requestHeaders['user-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

      callback({ requestHeaders: details.requestHeaders });
    });

    ses.setProxy({
      proxyRules: 'http://127.0.0.1:3001',  // 代理地址
      proxyBypassRules: 'localhost'  // 忽略本地流量
    }).then(() => {
      console.log('Proxy set successfully');
    }).catch((error) => {
      console.error('Failed to set proxy', error);
    });
    // dom-ready之后显示界面
    this.mainWindow.once("ready-to-show", () => {
      this.mainWindow.show();
      if (config.UseStartupChart) this.loadWindow.destroy();
    });
    // 开发模式下自动开启devtools
    if (process.env.NODE_ENV === "development") {
      this.mainWindow.webContents.openDevTools({
        mode: "undocked",
        activate: true,
      });
    }
    // 不知道什么原因，反正就是这个窗口里的页面触发了假死时执行
    this.mainWindow.on("unresponsive", () => {
      dialog
        .showMessageBox(this.mainWindow, {
          type: "warning",
          title: "警告",
          buttons: ["重载", "退出"],
          message: "图形化进程失去响应，是否等待其恢复？",
          noLink: true,
        })
        .then((res) => {
          if (res.response === 0) this.mainWindow.reload();
          else this.mainWindow.close();
        });
    });
    /**
     * 新的gpu崩溃检测，详细参数详见：http://www.electronjs.org/docs/api/app
     * @returns {void}
     * @author zmr (umbrella22)
     * @date 2020-11-27
     */
    this.childProcessGone(this.mainWindow);
    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });
  }
  // 加载窗口函数
  loadingWindow(loadingURL: string) {
    this.loadWindow = new BrowserWindow({
      width: 400,
      height: 600,
      frame: false,
      skipTaskbar: true,
      transparent: true,
      resizable: false,
      webPreferences: {
        experimentalFeatures: true,
        preload: getPreloadFile("index"),
      },
    });

    this.loadWindow.loadURL(loadingURL);
    this.loadWindow.show();
    this.loadWindow.setAlwaysOnTop(true);
    this.createMainWindow();
  }
  // 初始化窗口函数
  initWindow() {
    if (config.UseStartupChart) {
      return this.loadingWindow(this.shartURL);
    } else {
      return this.createMainWindow();
    }
  }
}
export default MainInit;
