import * as pty from 'node-pty';
const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cwd: process.env.HOME,
    env: process.env,
});
// 将 PTY 输出发送到前端
ptyProcess.on('data', (data) => {
    console.log(data);
});

ptyProcess.on('error', (error) => {
    console.error('Error:', error);
});

ptyProcess.on('exit', (code, signal) => {
    console.log(`Process exited with code: ${code}, signal: ${signal}`);
});

ptyProcess.write('dir\n')