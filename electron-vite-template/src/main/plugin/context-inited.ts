import { pluginContext } from '@lib/main'
import { dialog, ipcMain } from "electron";
import { notify } from '@main/ipc/notify-manager';
import { notifyError } from '@main/ipc/notify-manager';

const init = () => {
    pluginContext.ipcMain = ipcMain as any;
    pluginContext.notifyManager = { notify, notifyError } as any
    pluginContext.showDialog = dialog.showMessageBox
}
export default init;