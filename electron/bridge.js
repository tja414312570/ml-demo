import {showErrorDialog} from "./utils.js"
// 执行 JS 代码的通用函数
const invokeJs = (invokeJsCode, callback) => {
    console.log(`执行 JS 代码:\n${invokeJsCode}`);
    if( global.window){
        global.window.webContents.executeJavaScript(invokeJsCode)
        .then(result => {
            console.log("JS 函数执行成功！" + result);
            if (callback) callback(null, result);  // 调用回调并返回结果
        })
        .catch(err => {
            console.error("JS 函数执行失败：" + err);
            if (callback) callback(err);
        });
    }else{
        showErrorDialog("窗口未初始化")
    }
};

// 处理消息的函数，确保安全传递参数
const processInvokeArguments = (invokeArguments) => {
    if (!invokeArguments || invokeArguments.trim() === '""') {
        invokeArguments = "`没有任何输出`";  // 返回默认的消息
    }

    if (typeof invokeArguments === 'string') {
        // 对参数进行适当的转义处理，避免引号冲突
        if (!(invokeArguments.startsWith('`') && invokeArguments.endsWith('`'))) {
            invokeArguments = `\`${invokeArguments.replace(/`/g, '\\`')}\``;
        }
    }
    return invokeArguments;
};

// 通知应用的函数
const notifyApp = ( message) => {
    const jsTemplate = `
        document.myApp.notify(${processInvokeArguments(message)});
    `;
    invokeJs(jsTemplate);  // 传递窗口对象和 JS 模板
};

// 通知应用错误的函数
const notifyAppError = (message) => {
    const jsTemplate = `
        document.myApp.error(${processInvokeArguments(message)});
    `;
    invokeJs(jsTemplate);  // 传递窗口对象和 JS 模板
};

const sendApp = (message) => {
    const jsTemplate = `
        document.myApp.send(${processInvokeArguments(message)});
    `;
    invokeJs(jsTemplate);  // 传递窗口对象和 JS 模板
};

const uploadFile = (files)=>{
    async function uploadFile(page, filePath) {
        const inputFile = await page.$('input[type="file"]');
        console.log("上传文件路径:", filePath);
        await inputFile.setInputFiles(files);
    }
    
}
// 集中导出所有函数
export {
    notifyApp,
    notifyAppError,
    invokeJs,
    sendApp,
    uploadFile
};
