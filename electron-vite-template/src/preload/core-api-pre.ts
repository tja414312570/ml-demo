import { exposeInMainWorld } from "./ipc-wrapper";
import { } from "electron";
exposeInMainWorld('core-api', {});
exposeInMainWorld('core-api.window', {});