// modules/module1.js
export const support = 'cmd';
export async function execute(data) {
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