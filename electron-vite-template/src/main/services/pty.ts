import { send_ipc_render } from "@main/ipc/send_ipc";
import { wrapper } from "@main/plugin/Iproxy";
import { pluginContext } from "@lib/main";
import { IPty } from '@lib/main'
import { ipcMain } from "electron";
import * as pty from 'node-pty';
let isinit = false;
function init() {
    console.log(new Error(isinit + ''))
    if (isinit) {
        console.log("已经初始化")
        throw new Error("已经初始化")
    }
    isinit = true;
    try {
        // 创建 PTY 实例
        const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
        console.log("启动PTY shell:", shell);
        const ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.env.HOME,
            env: process.env,
        });
        pluginContext.pty = wrapper<IPty>(ptyProcess);
        (pluginContext.pty as any).type = shell;
        // 监听输入事件
        ipcMain.on('pty.terminal-input', (event, input) => {
            ptyProcess.write(input);
        });

        // 监听终端数据输出
        ptyProcess.onData((data) => {
            send_ipc_render('pty.terminal-output', data);
        });

        ipcMain.on('pty.terminal-into', (event, data) => {
            ptyProcess.write(data);
        });

        // 调整终端大小
        ipcMain.on('pty.terminal-resize', (event, cols, rows) => {
            if (cols > 0 && rows > 0) {
                ptyProcess.resize(cols, rows);
            } else {
                console.warn('Invalid terminal size:', cols, rows);
            }
        });
    } catch (error) {
        console.error("Error initializing PTY:", error);
    }
}
export { init }