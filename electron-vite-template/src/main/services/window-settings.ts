import { getPreloadFile, getUrl } from "@main/config/static-path";
import { BrowserWindow } from "electron";
import { registeMenu } from "./service-menu";

export const createWindow = () => {
    const settingURL = getUrl('setting');
    const mainWindow = new BrowserWindow({
        titleBarStyle: 'hidden',
        title: "设置",
        height: 720,
        useContentSize: true,
        width: 960,
        frame: false,
        minWidth: 720,
        show: false,
        webPreferences: {
            // webSecurity: false,
            webviewTag: true,
            // 如果是开发模式可以使用devTools
            devTools: process.env.NODE_ENV === "development",
            // 在macos中启用橡皮动画
            scrollBounce: process.platform === "darwin",
            preload: getPreloadFile("setting-ipc"),
            // allowRunningInsecureContent: true // 允许不安全内容
        },
    });
    mainWindow.loadURL(settingURL);
    // mainWindow.webContents.openDevTools({
    //     mode: "undocked",
    //     activate: true,
    // });
    mainWindow.webContents.on('will-attach-webview', (e, webPreferences) => {
        webPreferences.webSecurity = false
        webPreferences.allowRunningInsecureContent = true
        // webPreferences.preload = getPreloadFile('webview')
    })
    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    })
}

registeMenu({
    label: '设置',
    key: 'setting',
    click: () => {
        createWindow();
    }
}, "general")