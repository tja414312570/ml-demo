import { InstructContent, InstructExecutor, InstructResult } from '../../../src/main/plugin/type/bridge'
import { Pluginlifecycle } from '../../../src/main/plugin/type/plugin-lifecycle'
import { PluginExtensionContext } from "../../../src/main/plugin/type/plugin";
import { v4 as uuidv4 } from 'uuid';


const removeInvisibleChars = (str: string) => {
  // 移除 ANSI 转义序列 (\u001b 是转义字符, \[\d*(;\d*)*m 匹配 ANSI 的样式)
  // const noAnsi = str.replace(/\u001b\[\d*(;\d*)*m/g, '');
  // // 移除其他不可见字符 (包括空白符、制表符、换行符)
  // const cleanedStr = noAnsi.replace(/[\x00-\x1F\x7F]/g, ''); // \x00-\x1F 包含不可见字符范围
  let cleanedStr = str.replace(/\u001b\[\d*(;\d*)*m/g, '');

  // 移除 PowerShell 特有的控制字符 (例如，\r\n[?25l 和类似的序列)
  cleanedStr = cleanedStr.replace(/\[\?\d+[a-z]/gi, '');

  // 移除回车和换行符、其他不可见字符 (包括空白符、制表符、换行符)
  cleanedStr = cleanedStr.replace(/[\x00-\x1F\x7F\x80-\x9F]+/g, '');

  // 移除光标定位和清屏等特殊字符序列，例如 [24;21H 和 [1C 之类的
  cleanedStr = cleanedStr.replace(/\[\d+;\d+[A-Za-z]|\[\d+[A-Za-z]/g, '');
  return cleanedStr;
};

class SshExecutor implements InstructExecutor, Pluginlifecycle {
  execute(instruct: InstructContent): Promise<InstructResult> {
    const { id, code } = instruct;

    return new Promise((resolve, reject) => {
      let executeing = true;
      let results: string[] = []
      const end_tag = `_${uuidv4()}_`;
      const end_cmd = process.platform === 'win32' ?
        ' ; echo s' + end_tag :
        ' && echo s' + end_tag + ' || echo f' + end_tag; //ssh
      // 将 PTY 输出发送到前端
      const disable = pluginContext.pty.onData((data: string) => {

        if (executeing) {

          const lines = data.split(/\r?\n/); // 按换行符分割
          for (const line of lines) {
            // console.log(`读取行:"${JSON.stringify(line)}"${line.length},"${JSON.stringify(end_tag)}"${end_tag.length}`, executeing,line.trim() === end_tag); 
            const lineTrim = removeInvisibleChars(line);
            if (lineTrim.length > 1 && lineTrim.substring(1) === end_tag) {
              // executeing = false;
              console.log("代码执行完毕", results.join())
              const result = results.join('\r\n');
              pluginContext.sendIpcRender('codeViewApi.insertLine', { id, code: `控制台：\r\n${result}`, line: code.split(/\r?\n/).length })
              resolve({
                id: instruct.id,
                ret: result,
                // std:results.join()
              });
              // resolve(results.join())
              disable.dispose()
            } else if (lineTrim.length > 1) {
              const lineTrimProcess = lineTrim.replace(end_cmd, '');
              results.push(lineTrimProcess)
            }
          }
        }
      });
      const code_splits = instruct.code
        .split(/\r?\n/)
        .filter(line => line.trim() && !/^\s*(#|REM|::)/i.test(line));

      // const cmd = code_splits.join(' && ') + end_cmd+'\r\n';
      const cmd = process.platform === 'win32' ?
        code_splits.join(' ; ') + end_cmd + '\r\n' :
        code_splits.join(' && ') + end_cmd + '\r\n';
      console.log(`发送指令:${cmd}`);
      pluginContext.pty.write(cmd)
    })
  }

  onMounted(ctx: PluginExtensionContext): void {
    global.pluginContext = ctx;
  }
  onUnmounted(ctx: PluginExtensionContext): void {
  }


}
export default new SshExecutor();
