import { showErrorDialog } from "@main/utils/dialog";

const _notify_app = (message: string, is_error: boolean) => {
    if (global.mainWindow) {
        console.log(`发送通知${JSON.stringify({ message, is_error })}`)
        global.mainWindow.webContents.send('show-notification', { message, is_error });
    } else {
        console.error("程序未启动完成", new Error("程序未启动完成"))
        showErrorDialog("拦截器尚未初始化")
    }
};
// 通知应用的函数
const notify = (message: string) => {
    _notify_app(message, false)
};

// 通知应用错误的函数
const notifyError = (message: string) => {
    _notify_app(message, true)
};
export { notify, notifyError }