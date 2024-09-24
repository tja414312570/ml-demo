
import os from 'os';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import { execFile, exec } from 'child_process';

// 使用 promisify 将子进程命令转换为 Promise
const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

export const support = 'bash';

// 执行 shell 命令
export async function execute(command) {
    console.log(`执行 shell 命令: ${command}`);
    try {
        const env = {
            ...process.env,
            "https_proxy": "http://127.0.0.1:7890",
            "http_proxy": "http://127.0.0.1:7890",
            "all_proxy": "socks5://127.0.0.1:7890"
        };

        const { stdout, stderr } = await execAsync(command, { env });
        return stdout + (stderr ? `\nError: ${stderr}` : '');
    } catch (error) {
        return `执行 shell 时出错: ${error.message}`;
    }
}