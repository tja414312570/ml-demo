import { getSettings, getSettingConfig, getSettingValue, saveSettingValue } from "@main/services/service-setting";
import { ipcMain } from "electron";

ipcMain.handle('ipc-settings.get-settings', (event, args) => {
    return getSettings();
});
ipcMain.handle('ipc-settings.get-setting-value', (event, key) => {
    return getSettingValue(key);
});

ipcMain.handle('ipc-settings.save-setting-value', (event, json) => {
    console.log("接受到新菜单,", JSON.stringify(json))
    saveSettingValue(json)
    return;
});
