import VirtualWindow from '../plugins/ssh_executor/src/virtual-window';

let isDebug = true;
export function debug(data: string) {
    return isDebug ? data.replace(/[\x00-\x1F\x7F]/g, (char) => {
        const hex = char.charCodeAt(0).toString(16).padStart(2, '0');
        return `\\x${hex}`;
    }) : data;
}
const vw = new VirtualWindow();
function testVirtualWindow(data: string) {
    // 测试1：写入基础文本
    console.log("=================原始数据")
    console.log(debug(data));
    vw.write(data);
    console.log("-----------------渲染数据")
    console.log(debug(vw.render()));
}

testVirtualWindow('\x1b[?9001h\x1b[?1004h');
// testVirtualWindow('\x1b[?25l\x1b[2J\x1b[m\x1b[HWindows PowerShell\x0d\x0a版权所有（C） Microsoft Corporation。保留所有权利。\x1b[4;1H安装最新的 PowerShell，了解新功能和改进！https://aka.ms/PSWindows\x1b]0;C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe\x07\x1b[?25h')
