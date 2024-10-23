import { pluginContext } from '@lib/main'
import { dialog, ipcMain } from "electron";
import { notify } from '@main/ipc/notify-manager';
import { notifyError } from '@main/ipc/notify-manager';
import { send_ipc_render } from '@main/ipc/send_ipc';

const init = () => {
    pluginContext.ipcMain = ipcMain as any;
    pluginContext.notifyManager = { notify, notifyError } as any
    pluginContext.showDialog = dialog.showMessageBox
    pluginContext.sendIpcRender = send_ipc_render;
}
export default init;