import { showErrorDialog } from "@main/utils/dialog";

export const send_ipc_render = (event_: string, message: any) => {
    if (global.mainWindow) {
        console.log(`发送通知${JSON.stringify({ event_, message })}`)
        global.mainWindow.webContents.send(event_, message);
    } else {
        console.error("程序未启动完成", new Error("程序未启动完成"))
        showErrorDialog("拦截器尚未初始化")
    }
};