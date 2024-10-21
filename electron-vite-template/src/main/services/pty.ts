import { send_ipc_render } from "@main/ipc/send_ipc";
import { wrapper } from "@main/plugin/Iproxy";
import pluginContext from "@main/plugin/plugin-context";
import { IPty } from '@lib/main'
import { ipcMain } from "electron";
import * as pty from 'node-pty';
let isinit = false;
function init() {
    console.log(new Error(isinit + ''))
    if (isinit) {
        console.log("我日你妈")
        throw new Error("超你妈的已经初始化了")
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

        console.log('PTY Process created:', ptyProcess.pid);

        pluginContext.pty = wrapper<IPty>(ptyProcess);
        (pluginContext.pty as any).type = shell;

        // 监听输入事件
        ipcMain.on('terminal-input', (event, input) => {
            console.log('Received terminal input:', input);
            ptyProcess.write(input);
        });

        // 监听终端数据输出
        ptyProcess.onData((data) => {
            console.log('PTY output data:', data);
            send_ipc_render('terminal-output', data);
        });

        ipcMain.on('terminal-into', (event, data) => {
            console.log('Received terminal into:', data);
            ptyProcess.write(data);
        });

        // 调整终端大小
        ipcMain.on('terminal-resize', (event, cols, rows) => {
            console.log('Resizing terminal to:', cols, rows);
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