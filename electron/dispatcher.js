import { promises as fs } from 'fs';
import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import path from 'path';
import { notifyApp, notifyAppError, sendApp ,uploadFile} from './bridge.js';

import util from 'util';

import { createWindow ,requiredWindow} from './window_manager.js';

import {loadModules} from './modules.js'

const executors = {};

loadModules('executor', (file, module) => {
    if (!module.execute) {
        throw new Error(` “${file}“ executor not implements execute function`);
    }
    // 检查 executor.execute 是否是函数
    if (typeof module.execute !== 'function') {
        throw new Error(` “${file}“ executor executor.execute is not a function`);
    }
    executors[module.support] = module;
    console.log(`load-module: ${file},${module.support}`);
}).catch(console.error);

// 使用 promisify 将子进程命令转换为 Promise
const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

// 提取代码块的函数
function extractCodeBlocksFromMarkdown(serverOutput) {
    const supportedLanguages = Object.keys(executors).join('|');
    const pattern = new RegExp(`\`\`\`(${supportedLanguages})\\n([\\s\\S]*?)\`\`\``, 'g');
    const codeBlocks = [];
    let match;

    while ((match = pattern.exec(serverOutput)) !== null) {
        codeBlocks.push([match[1], match[2]]);
    }

    return codeBlocks;
}

let responseData;
// 处理 EventStream 数据并返回 JSON 的处理函数
// 异步处理 JSON 数据
async function processEventData(body,headers) {

    console.log("收到的请求头信息：",body);
    
    if (body) {
        if (body === '[DONE]') {
            console.log("EventStream 完成，等待处理...");
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
            if (executors[language]) {
                console.log(`检测到的 ${language} 代码:\n${code}`);
                await notifyApp(`检测到的 ${language} 代码:\n${code}`);
                const executor = executors[language];
                // 检查 executor 是否存在
                if (!executor.execute) {
                    throw new Error(` “${language}“ executor not implements execute function`);
                }
                // 检查 executor.execute 是否是函数
                if (typeof executor.execute !== 'function') {
                    throw new Error(` “${language}“ executor executor.execute is not a function`);
                }
                const window = requiredWindow("代码窗口");
                window.webContents.on('did-finish-load', () => {
                    console.log('Page is fully loaded.');
                    window.sendCode(code)
                    // 你可以在这里执行任何你需要的操作
                });
                // const result = await executor.execute(code);
                // console.log(`执行结果:\n${result}`);
                // await notifyApp(`执行 ${language} 结果:\n${result}`);
                // await dispatcherResult(result);
            } else {
                await notifyApp(`不支持的代码语言: ${language}`);
            }
        }
    } else {
        console.log("未检测到代码块");
        await notifyApp("未检测到代码块");
    }
}

const regex = /fileupload:\[(.*?)\]/;

// 解析结果函数
async function decodeResult(resultString) {
    try {
        // 使用正则表达式提取 fileupload 列表
        const match = resultString.match(regex);

        if (match) {
            const arrayStr = `[${match[1]}]`;  // 将匹配结果转换为有效的数组格式

            try {
                // 使用 JSON.parse() 将字符串转换为数组
                const fileList = JSON.parse(arrayStr.replace(/'/g, '"'));  // 将单引号替换为双引号
                return fileList;
            } catch (error) {
                const errorMessage = `解析 fileupload 列表时出错: ${error.message}，数据：${arrayStr}`;
                const errorTraceback = util.inspect(error);  // 打印错误栈
                const fullErrorReport = `${errorMessage}\n错误栈：\n${errorTraceback}`;
                console.error(fullErrorReport);
                // 调用 dispatcherResult 发送错误报告
                await dispatcherResult(fullErrorReport, true);
                return null;
            }
        } else {
            // 没有匹配到 fileupload 列表
            const errorMessage = "未找到 fileupload 列表。";
            console.error(errorMessage);
            return null;
        }
    } catch (error) {
        // 捕获其他异常并生成完整的错误报告
        const errorMessage = `处理 fileupload 列表时出错: ${error.message}，数据：${resultString}`;
        const errorTraceback = util.inspect(error);  // 获取详细的错误栈
        const fullErrorReport = `${errorMessage}\n错误栈：\n${errorTraceback}`;
        console.error(fullErrorReport);

        // 调用 dispatcherResult 发送错误报告
        await dispatcherResult(fullErrorReport, true);
        return null;
    }
}
async function dispatcherResult(param, isDecodeResult = false) {
    if (!isDecodeResult) {
        const uploadFiles = await decodeResult(param);
        if (uploadFiles && uploadFiles.length > 0) {
            await uploadFile(uploadFiles);
        }
    }
    sendApp(param)
}


let currentData = '';

const decodeEventStream = (data)=> {
    // 将事件流根据两个换行符进行分割
    const events = data.split('\n\n');

    events.forEach(event => {
        if (event.startsWith('data:')) {
            const eventData = event.slice(5).trim();  // 去除前面的 'data:' 并移除空白字符
            try {
                console.log('Received Event:', eventData);
                // 如果事件流发送 '[DONE]'，处理最终的响应数据
                if (eventData === '[DONE]') {
                    processResponse(currentData);
                } 
                // 检查数据中是否包含特定标志 '"finished_successfully"'
                else if (eventData.includes('"finished_successfully"')) {
                    currentData = eventData;
                }
            } catch (error) {
                console.error(`Failed to parse event data: ${eventData}`, error);
            }
        }
    });
}

const processResponse = async (ctx, bodyString)=> {
    try{
        const contentType = ctx.serverToProxyResponse.headers['content-type'] || '';

        // 检查是否为 SSE (text/event-stream)
        if (contentType.includes('text/event-stream')) {
            console.log(`Captured SSE from ${ctx.clientToProxyRequest.url}`);

            // 获取响应体的数据流（SSE 是流式数据，可能会多次发送）
            const sseData = bodyString;

            // 将 SSE 数据根据事件分隔符 \n\n 进行分割
            const events = sseData.split('\n\n');

            // 遍历每个事件并处理
            events.forEach(event => {
                if (event.startsWith('data:')) {
                    // 去除 'data:' 前缀并整理数据
                    const eventData = event.slice(5).trim();
                    // 打印 SSE 事件数据
                    console.log(`SSE Event Data:\n${eventData}`);
                    processEventData(eventData,ctx.serverToProxyResponse.headers).then(()=>{
                    }).catch(err=>{
                        console.error(err);
                        notifyAppError(err)
                    })
                }
            });
        }
    }catch(err){
        console.error(err);
        notifyAppError(err)
    }
}


export {
    decodeResult,
    processEventData,
    dispatcherResponse,
    decodeEventStream,
    processResponse
};
