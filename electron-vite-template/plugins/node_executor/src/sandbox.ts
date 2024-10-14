import { createContext, runInContext } from 'vm';
import fs from 'fs';
import path from 'path';
import os from 'os';

class NodeSandbox {
  constructor() {
    // 创建 ES6 的沙盒上下文，包含 Node.js 的一些内置模块
    this.context = {
      console: {
        log: (...args) => {
          console.log('[沙盒日志]:', ...args);
        },
        error: (...args) => {
          console.error('[沙盒错误]:', ...args);
        }
      },
      require,  // 使用 ES6 导入，注入 require
      process: {
        env: {
          NODE_ENV: 'sandbox',  // 设置环境变量为沙盒环境
        },
        cwd: () => '/sandbox',  // 限制工作目录
        platform: process.platform,
      },
      os,  // 注入 os 模块
      path,  // 注入 path 模块
      Buffer,  // 注入 Buffer 对象
      setTimeout,  // 注入定时器
      setInterval,
      clearTimeout,
      clearInterval,
      fs: this.createRestrictedFS(),  // 使用限制后的 fs 模块
    };
  }

  // 创建受限的 fs 模块，只允许访问 /sandbox 目录
  createRestrictedFS() {
    return {
      readFile: (filePath, encoding, callback) => {
        if (!filePath.startsWith('/sandbox')) {
          return callback(new Error('禁止访问此路径'));
        }
        return fs.readFile(filePath, encoding, callback);
      },
      writeFile: (filePath, data, callback) => {
        if (!filePath.startsWith('/sandbox')) {
          return callback(new Error('禁止访问此路径'));
        }
        return fs.writeFile(filePath, data, callback);
      },
      // 可以进一步扩展更多受限操作
    };
  }

  // 使用 async/await 方式执行用户代码
  async runCode(code) {
    try {
      // 创建一个新的沙盒上下文
      const sandboxContext = createContext(this.context);
      
      // 使用 ES6 模板字符串包裹异步执行的代码
      await runInContext(`(async () => { ${code} })()`, sandboxContext);

      return '代码执行成功';
    } catch (error) {
      throw new Error(`沙盒执行出错: ${error.message}`);
    }
  }
}

// 示例：在沙盒中执行代码
const sandbox = new NodeSandbox();

const code = `
  const fs = require('fs');
  fs.readFile('/sandbox/test.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('文件读取失败:', err.message);
    } else {
      console.log('文件内容:', data);
    }
  });
  console.log('操作系统平台:', os.platform());
  console.log('当前目录:', process.cwd());
`;

sandbox.runCode(code)
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });
