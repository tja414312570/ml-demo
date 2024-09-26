import { ipcMain } from 'electron';

ipcMain.handle('register-command', (event, commandName, callback) => {
  // 注册命令
  commands[commandName] = callback;
});
import { ipcRenderer } from 'electron';

export function activate() {
  ipcRenderer.invoke('register-command', 'say-hello', () => {
    console.log('Hello from ES6 plugin!');
  });
}
