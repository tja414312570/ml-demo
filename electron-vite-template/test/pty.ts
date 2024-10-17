import * as pty from 'node-pty';
const shell = process.platform === 'win32' ? 'powershell.exe' : 'zsh';
import VirtualWindow from './VirtualWindow'
const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cwd: process.env.HOME,
    env: process.env,
    cols: 40,
    rows: 40,
});
const virtualWindow = new VirtualWindow;
// (async () => {
//     for (let i = 1; i <= 100; i++) {
//         virtualWindow.write(`\rProgress: ${i}%`);
//         console.log("=============================================")
//         console.log(virtualWindow.render());
//         await sleep(100); // 模拟延迟
//     }
// })()
// function sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// 将 PTY 输出发送到前端
ptyProcess.on('data', (data) => {
    virtualWindow.write(data.toString('utf8')); // 将数据写入虚拟窗口
    const output = virtualWindow.render();
    // console.clear()
    console.log("----------------------------原始相应")
    const printableOutput = data.replace(/[\x00-\x1F\x7F]/g, (char) => {
        // 处理控制字符
        const hex = char.charCodeAt(0).toString(16).padStart(2, '0');
        return `\\x${hex}`;
    });
    console.log(printableOutput)
    console.log("=============================================")
    const printableOutput2 = output.replace(/[\x00-\x1F\x7F]/g, (char) => {
        // 处理控制字符
        const hex = char.charCodeAt(0).toString(16).padStart(2, '0');
        return `\\x${hex}`;
    });
    console.log(printableOutput2)
});

ptyProcess.on('error', (error) => {
    virtualWindow.write(error); // 将数据写入虚拟窗口
    console.error('Error:', error);
});

ptyProcess.on('exit', (code, signal) => {
    console.log(`Process exited with code: ${code}, signal: ${signal}`);
});

// ptyProcess.write('for i in {1..100}; do printf "\\rProgress: %d%%" "$i"; sleep 0.1; done; echo\n');

// ptyProcess.write('ls ;for i in {1..100}; do printf "\\rProgress: %d%%" "$i"; sleep 0.1; done; echo "done";clear\n');
ptyProcess.write('top\n');