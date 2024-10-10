import { ipcMain } from "electron";
import pluginManager from "./plugin-manager";

const bindIpc = () => {
    ipcMain.handle('get-plugin-list', (event, args) => {
        return pluginManager.getAllPlugins();
    })
}
export default bindIpc;