import { ipcRenderer } from "electron";

import { exposeInMainWorld, ipcRenderMapper } from "./ipc-wrapper";

const api = 'webview-api'

exposeInMainWorld(api, {
  on: (channel, callback) => {
    console.log("webview监听:", channel)
    ipcRenderMapper.on(channel, (event, message) => {
      console.log("webview消息:", message)
      callback(event, message)
    })
  }
})

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 已经加载完成');
  function loadModule(url) {
    const script = document.createElement('script');
    // script.type = 'module';  // 指定为 ES6 模块
    script.src = url;  // 设置模块的路径
    script.onload = () => {
      console.log(`${url} loaded successfully`);
    };
    script.onerror = (error) => {
      console.error(`Failed to load module: ${url}`, error);
    };
    document.head.appendChild(script);  // 将 script 标签插入到页面
  }
  ipcRenderer.invoke("load-script", 'js_bridge').then(file_addr => {
    console.log(`获取文集：${file_addr}`)
    // 调用示例，加载模块化的 JavaScript 文件
    loadModule(file_addr);
  }).catch(err => {
    console.error("加载脚本异常", err)
  })
});