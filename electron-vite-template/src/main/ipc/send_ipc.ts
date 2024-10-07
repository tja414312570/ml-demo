import { getWebContentIds } from "@main/services/web-content-listener";
import { showErrorDialog } from "@main/utils/dialog";
import { webContents } from "electron";

export const send_ipc_render = (event_: string, message: any) => {
    if (global.mainWindow) {
        const webContentIds: Array<number> | undefined = getWebContentIds(event_)
        if (webContentIds && webContentIds.length > 0) {
            webContentIds.forEach(webContentId => {
                const webContent = webContents.fromId(webContentId)
                if (webContent) {
                    console.log(`发送通知到webview进程${webContentId},${JSON.stringify({ event_, message })}`)
                    webContent.send(event_, message)
                } else {
                    console.warn(`webcontent已被移除:${webContentId},${JSON.stringify({ event_, message })}`)
                }
            })
        } else {
            console.log(`发送通知到主进程${JSON.stringify({ event_, message })}`)
            global.mainWindow.webContents.send(event_, message);
        }
    } else {
        console.error("程序未启动完成", new Error("程序未启动完成"))
        showErrorDialog("拦截器尚未初始化")
    }
};