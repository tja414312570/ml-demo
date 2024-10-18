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
