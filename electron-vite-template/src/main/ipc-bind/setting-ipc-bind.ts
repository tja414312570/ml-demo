import { getSettings, getSettingConfig } from "@main/services/service-setting";
import { ipcMain } from "electron";

ipcMain.handle('ipc-settings.get-settings', (event, args) => {
    return getSettings();
});