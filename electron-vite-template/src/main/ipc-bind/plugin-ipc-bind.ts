import { Bridge, PluginType } from "@lib/main";
import pluginManager from "@main/plugin/plugin-manager";
import { ipcMain } from "electron";

ipcMain.handle('load-script', (event, fileName) => {
    return new Promise((resolve, reject) => {
        pluginManager.resolvePluginModule<Bridge>(PluginType.agent).then(module => {
            resolve(module.requireJs());
        }).catch(error => {
            reject(error)
        })
    })
});