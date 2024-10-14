import { spawn } from 'child_process';  // ES6 模块导入语法

// 定义一个函数来直接执行 Python 代码
const runPythonCode = async (code) => {
  return new Promise((resolve, reject) => {
    // 通过 `python -c` 运行传递的 Python 代码
    const pythonProcess = spawn('python', ['-c', code]);

    let output = '';

    // 获取 Python 脚本的输出
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    // 捕获错误输出
    pythonProcess.stderr.on('data', (data) => {
      console.error(`错误: ${data}`);
      reject(data.toString());
    });

    // Python 执行结束时
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(`Python 进程退出，退出码: ${code}`);
      }
    });
  });
};

// 示例：调用函数执行 Python 代码
const pythonCode = `
print("Hello from Python!")l
x = 10
y = 20
print("Sum:", x + y)
`;

runPythonCode(pythonCode)
  .then(result => {
    console.log('Python 输出:', result);  // 处理 Python 输出
  })
  .catch(error => {
    console.error('执行 Python 代码时出错:', error);
  });
