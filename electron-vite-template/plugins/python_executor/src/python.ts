import { spawn } from "child_process";

export const runPythonCode = async (code:string):Promise<string> => {
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
        // reject(data.toString());
        output+=data.toString()
      });
  
      // Python 执行结束时
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(`${output}\r\nPython 进程退出，退出码: ${code}`);
        }
      });
    });
  };