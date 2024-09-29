import os from 'os';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import path from 'path';

import { execFile, exec } from 'child_process';

// 使用 promisify 将子进程命令转换为 Promise
const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);
export const support = 'python';
// 执行 Python 代码
export async function execute(code) {
    try {
        console.log(`执行 Python 代码: ${code}`);
        const tempFilePath = path.join(os.tmpdir(), `${Date.now()}.py`);
        await fs.writeFile(tempFilePath, code, 'utf-8');

        const env = {
            ...process.env,
            "https_proxy": "http://127.0.0.1:7890",
            "http_proxy": "http://127.0.0.1:7890",
            "all_proxy": "socks5://127.0.0.1:7890"
        };

        const { stdout, stderr } = await execFileAsync('python', [tempFilePath], { env });
        let output = stdout;
        if (stderr) {
            output += `\nError: ${stderr}`;
        }

        await fs.unlink(tempFilePath);
        return output;
    } catch (error) {
        console.log(error)
        return `执行代码时出错: ${error.message}`;
    }
}