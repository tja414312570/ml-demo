import { promises as fs } from 'fs';
import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import path from 'path';

// 使用 promisify 将子进程命令转换为 Promise
const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

// 提取代码块的函数
function extractCodeBlocksFromMarkdown(serverOutput) {
    const pattern = /```(python|bash)\n([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;

    while ((match = pattern.exec(serverOutput)) !== null) {
        codeBlocks.push([match[1], match[2]]);
    }

    return codeBlocks;
}

// 执行 Python 代码
async function executePythonCode(code) {
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

        const { stdout, stderr } = await execFileAsync('python3', [tempFilePath], { env });
        let output = stdout;
        if (stderr) {
            output += `\nError: ${stderr}`;
        }

        await fs.unlink(tempFilePath);
        return output;
    } catch (error) {
        return `执行代码时出错: ${error.message}`;
    }
}

// 执行 shell 命令
async function runShellCommand(command) {
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

// 上传文件的函数
async function uploadFile(page, filePath) {
    const inputFile = await page.$('input[type="file"]');
    console.log("上传文件路径:", filePath);
    await inputFile.setInputFiles(filePath);
}

// 处理 fileupload 列表的解析函数
async function decodeResult(resultString) {
    try {
        const match = resultString.match(/fileupload:\[(.*?)\]/);

        if (match) {
            const arrayStr = `[${match[1]}]`;

            try {
                const fileList = JSON.parse(arrayStr);
                return fileList;
            } catch (error) {
                const errorReport = `解析 fileupload 列表时出错: ${error.message}`;
                console.error(errorReport);
                return null;
            }
        } else {
            console.log("未找到 fileupload 列表。");
            return null;
        }
    } catch (error) {
        console.error(`处理 fileupload 列表时出错: ${error.message}`);
        return null;
    }
}

// 处理 EventStream 数据并返回 JSON 的处理函数
function processEventData(eventData) {
    return new Promise((resolve) => {
        // 使用 promise 包装，异步处理 eventData
        setImmediate(async () => {
            try {
                const eventJson = JSON.parse(eventData);
                await processJsonData(eventJson);
                resolve();
            } catch (error) {
                console.error(`处理数据时出错: JSON 格式错误: ${error.message}, 数据：${eventData}`);
                resolve();  // 保持继续处理的流畅性
            }
        });
    });
}

// 异步处理 JSON 数据
async function processJsonData(eventJson) {
    const headers = eventJson.headers || {};
    const body = eventJson.body || '';

    console.log("收到的请求头信息：");
    for (const [key, value] of Object.entries(headers)) {
        switch (key) {
            case "content-length":
                console.log(`内容长度: ${value}`);
                break;
            case "authorization":
                console.log(`授权: ${value.slice(0, 10)}...（部分隐藏）`);
                break;
            case "accept":
                console.log(`接受内容类型: ${value}`);
                break;
            case "referer":
                console.log(`来源页面: ${value}`);
                break;
            case "cookie":
                console.log(`Cookie 信息: ${value.slice(0, 30)}...（部分隐藏）`);
                break;
            default:
                console.log(`${key}: ${value}`);
        }
    }

    if (body) {
        if (body === '[DONE]') {
            console.log("EventStream 完成，等待处理...");
            await dispatcherResponse(responseData);
        } else {
            const bodyData = JSON.parse(body);
            const message = bodyData.message || {};
            const content = message.content?.parts?.[0] || '';

            if (content) {
                responseData = content;
            }

            const metadata = message.metadata || {};
            if (metadata.model_slug) {
                console.log(`模型类型: ${metadata.model_slug}`);
            }

            if (metadata.model_switcher_deny) {
                metadata.model_switcher_deny.forEach(deny => {
                    console.log(`模型切换原因: ${deny.description || ''}`);
                });
            }
        }
    }

    console.log("\n完整数据已处理为中文输出\n");
}

// 调度响应并执行 Python 或 Bash 代码
async function dispatcherResponse(responseData) {
    console.log(`处理命令: ${responseData}`);
    await notifyApp(`处理命令: ${responseData}`);

    const codeBlocks = extractCodeBlocksFromMarkdown(responseData);

    if (codeBlocks.length > 0) {
        for (const [language, code] of codeBlocks) {
            if (language === 'python') {
                console.log(`检测到的 Python 代码:\n${code}`);
                await notifyApp(`检测到的 Python 代码:\n${code}`);
                const result = await executePythonCode(code);
                console.log(`执行结果:\n${result}`);
                await notifyApp(`执行 Python 结果:\n${result}`);
                await dispatcherResult(JSON.stringify(result));
            } else if (language === 'bash') {
                console.log(`检测到的 Bash 代码:\n${code}`);
                await notifyApp(`检测到的 Bash 代码:\n${code}`);
                const result = await runShellCommand(code);
                console.log(`执行 Bash 结果:\n${result}`);
                await notifyApp(`执行 Bash 完成`);
                await dispatcherResult(JSON.stringify(result));
            } else {
                await notifyApp(`不支持的代码语言: ${language}`);
            }
        }
    } else {
        console.log("未检测到代码块");
        await notifyApp("未检测到代码块");
    }
}

export {
    executePythonCode,
    runShellCommand,
    uploadFile,
    decodeResult,
    processEventData,
    processJsonData,
    dispatcherResponse,
};
