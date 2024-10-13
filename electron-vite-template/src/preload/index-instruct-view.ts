import { InstructContent } from "@main/ipc/code-manager";
import { exposeInMainWorld, ipcRenderMapper } from "./ipc-wrapper";

exposeInMainWorld('code-view-api', {
    onCode: (callback: Function) => ipcRenderMapper.on('codeViewApi.code', (event, notifyData) => {
        callback(notifyData);
    }),
    executeCode: (code: InstructContent) => ipcRenderMapper.invoke("codeViewApi.execute", code),
    onCodeExecuted: (callback: Function) => ipcRenderMapper.on('codeViewApi.code.executed', (event, notifyData) => {
        callback(notifyData);
    }),
});
