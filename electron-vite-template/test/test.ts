import path from 'path';
import VirtualWindow from '../plugins/ssh_executor/src/virtual-window';
import fs from 'fs';

let isDebug = true;
export function debug(data: string) {
    return isDebug ? data.replace(/[\x00-\x1F\x7F]/g, (char) => {
        const hex = char.charCodeAt(0).toString(16).padStart(2, '0');
        return `\\x${hex}`;
    }) : data;
}
function reverseReplace(data) {
    return data.replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });
}

const vw = new VirtualWindow();
function testVirtualWindow(data: string) {
    // 测试1：写入基础文本
    console.log("=================原始数据")
    console.log(debug(data));
    console.log("-----------------渲染数据")
    vw.write(data);
    console.log(debug(vw.render()));
}
// const text = fs.readFileSync(path.join(__dirname, 'vim.txt')).toString()
// const splits = text.split('\r\?n')
// console.log(reverseReplace(splits[0]))
// testVirtualWindow(reverseReplace(splits[0]))
// testVirtualWindow('hello')
// testVirtualWindow('hello')

console.log(reverseReplace('word\x1b[?1hhello'))