import { CodeContent, executeCodeCompleted } from "@main/ipc/code-manager";
import { loadModules } from "./modules";
import { notify } from "@main/ipc/notify-manager";
import { send_ipc_render } from "@main/ipc/send_ipc";
import { ipcMain } from "electron";

export const executors = {};


loadModules('../executor', (file, module) => {
    if (!module.execute) {
        throw new Error(` “${file}“ executor not implements execute function`);
    }
    // 检查 executor.execute 是否是函数
    if (typeof module.execute !== 'function') {
        throw new Error(` “${file}“ executor executor.execute is not a function`);
    }
    if (Array.isArray(module.support)) {
        // 如果 `support` 是数组，将数组中的每个元素都作为键赋值给 `executors`
        module.support.forEach((supportKey: string) => {
            executors[supportKey] = module;
        });
    } else {
        // 如果 `support` 是字符串，直接作为键赋值给 `executors`
        executors[module.support as string] = module;
    }
    console.log(`load-module: ${file},${module.support}`);
}).catch(console.error);

ipcMain.on('terminal-execute-completed', (event, input) => {
    console.log("搜到执行结果", input)
    executeCodeCompleted(input)
});
export const executeCode = async (code_body: CodeContent) => {
    console.log(`执行代码:\n${JSON.stringify(code_body)}`);
    const { code, language } = code_body;
    const executor = executors[language];
    // const result = await executor.execute(code);
    send_ipc_render('terminal-input', code)
    // console.log(`执行结果:\n${result}`);
    // notify(`执行 ${language} 结果:\n${result}`);
    // executeCodeCompleted({ code, language, result })
    // return result;
    // await dispatcherResult(result);
}