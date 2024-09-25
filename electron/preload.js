// preload.js
const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  // 监听表单提交事件
  const loginForm = document.querySelector('form');
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      // 获取用户名和密码的值
      const username = document.querySelector('input[name="username"]').value;
      const password = document.querySelector('input[name="password"]').value;

      // 将用户名和密码发送给主进程
      ipcRenderer.send('login-info', { username, password });
    });
  }
});
