import { getSettings, getSettingConfig } from "@main/services/service-setting";
import { ipcMain } from "electron";

ipcMain.handle('ipc-setting.get-settings', (event, args) => {
    return getSettings();
});