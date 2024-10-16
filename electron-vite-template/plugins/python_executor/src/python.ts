import { spawn } from "child_process";
import { InstructResultType } from "../../../src/main/plugin/type/bridge";

export const runPythonCode = async (id: string, code: string, execId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 通过 `python -c` 运行传递的 Python 代码
    const pythonProcess = spawn('python', ['-c', code]);

    let output = '';

    // 获取 Python 脚本的输出
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
      pluginContext.sendIpcRender('codeViewApi.insertLine',
        {
          id,
          code: `${data.toString()}\r\n`,
          line: code.split(/\r?\n/).length,
          type: InstructResultType.executing,
          execId
        })
    });

    // 捕获错误输出
    pythonProcess.stderr.on('data', (data) => {
      console.error(`错误: ${data}`);
      // reject(data.toString());
      output += data.toString()
      pluginContext.sendIpcRender('codeViewApi.insertLine', {
        id,
        code: `err:${data.toString()}\r\n`,
        line: code.split(/\r?\n/).length,
        type: InstructResultType.executing,
        execId
      })
    });

    // Python 执行结束时
    pythonProcess.on('close', (exit) => {
      if (exit === 0) {
        pluginContext.sendIpcRender('codeViewApi.insertLine', {
          id,
          code: `\r\nPython 进程正常退出，退出码: ${exit}`,
          line: code.split(/\r?\n/).length,
          type: InstructResultType.completed,
          execId
        })
        resolve(output);
      } else {
        pluginContext.sendIpcRender('codeViewApi.insertLine', {
          id,
          code: `\r\nPython 进程异常退出，退出码: ${exit}`,
          line: code.split(/\r?\n/).length,
          type: InstructResultType.failed,
          execId
        })
        reject(`${output}\r\nPython 进程异常退出，退出码: ${exit}`);
      }
    });
  });
};