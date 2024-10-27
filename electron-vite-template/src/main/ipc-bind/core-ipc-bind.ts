import { bindListenerChannel, removeListenerChannel } from "@main/services/web-content-listener";
import { showErrorDialog } from "@main/utils/dialog";
import { dialog, ipcMain } from "electron";

ipcMain.handle('ipc-core.get-current-webcontents-id', (event, input) => {
    return event.sender.id;
});
ipcMain.on('ipc-core.bind-channel-listener', (event, channel_info) => {
    const { webContentId, channel } = channel_info;
    bindListenerChannel(channel, webContentId)
});
ipcMain.on('ipc-core.remove-channel-listener', (event, channel_info) => {
    const { webContentId, channel } = channel_info;
    removeListenerChannel(channel, webContentId)
});
ipcMain.on('error-notify', (event, message) => {
    showErrorDialog(message)
})
ipcMain.handle('ipc-core.show-dialog', (event, opts: Electron.MessageBoxOptions) => dialog.showMessageBox(opts))