import { getIpcApi } from 'mylib/render'
declare var Vue: any;

const _doc = document as any;
const js_bridge = () => {
  if (_doc.myApp) {
    console.log("桥接程序已初始化", _doc.myApp)
    return;
  }
  let myApp = _doc.myApp = {
    sendButton: null,
    vueInstance: null,
    currentLocation: null,
    send: function (message:string) {
      // 找到 textarea 元素
      let textarea = document.querySelector('#prompt-textarea') as any;
      // 清空 textarea 的内容并填写新内容
      if (textarea) {
        console.log(textarea.tagName.toLowerCase())
        if (textarea.tagName.toLowerCase() === 'textarea') {
          textarea.value = message;  // 对 textarea 赋值
        }
        // 判断是否为 contenteditable 的 div
        else if (textarea.getAttribute('contenteditable') === 'true') {
          textarea.textContent = message;  // 对 contenteditable 的 div 赋值
        } else {
          console.error("元素既不是 textarea 也不是 contenteditable 的 div", textarea);
          alert("输入框不支持")
          return;
        }
        // 触发 input 事件，确保 React 或 Vue 等框架监听的事件能够捕捉到变化
        let inputEvent = new Event('input', { bubbles: true });
        textarea.dispatchEvent(inputEvent);
        console.log("输入值完成", message)
      } else {
        // alert("没有找到输入框")
        myApp.foundSendBtn()
      }

      // 找到具有 data-testid="send-button" 的按钮

      // 立即点击按钮
      console.log("发送按钮", _doc.myApp.sendButton, _doc)
      if (_doc.myApp.sendButton) {
        var loop = setInterval(() => {
          if (!_doc.myApp.sendButton.hasAttribute('disabled') && _doc.myApp.sendButton.getAttribute('data-testid') === 'send-button') {
            _doc.myApp.sendButton.click();
            console.log("按钮一点击", _doc.myApp.sendButton)
            clearInterval(loop)
          } else {
            console.log("按钮不可用", _doc.myApp.sendButton)
            if (textarea == null || textarea.value === '') {
              clearInterval(loop)
            }
          }
        }, 500)

      }
    }, createApp: function () {

      const loadVueScript = () => {
        console.log("加载vuejs1")
        return new Promise((resolve, reject) => {
          var script = _doc.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/vue@2';
          script.onload = resolve; // 成功加载时执行 resolve
          script.onerror = reject; // 加载失败时执行 reject
          _doc.head.appendChild(script);
          console.log("加载vuejs")
        });
      };

      loadVueScript().then(() => {
        // Vue 加载成功的逻辑
        const appDiv = _doc.createElement('div');
        appDiv.id = 'vue-app';
        _doc.body.appendChild(appDiv);
        console.log("加载vue脚本")
        // 定义 Vue 应用
        const App = {
          data() {
            return {
              message: '解释器未就绪'
            };
          },
          template: `
                        <div style="position: fixed; bottom: 100px; right: 20px; max-width: 300px; background-color: #ffffff; color: #333; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; padding: 8px; display: flex; align-items: flex-start;">
                            <div style="margin-right: 10px;">
                                <!-- 图标 -->
                                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 96 960 960" width="24" fill="#6200ea">
                                    <path d="M480 936q-150-31-245-158.5T140 503q0-102 50-188.5T320 172v85q-60 40-95 105.5T190 503q0 130 81.5 226T480 860v76Zm160-23v-85q60-41 95-106t35-143q0-130-81.5-226T480 292v-76q150 31 245 158.5T820 703q0 102-50 188.5T640 913ZM480 616q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Z"/>
                                </svg>
                            </div>
                            <div>
                                <!-- 标题 -->
                                <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #6200ea;">GPT 解释器</div>
                                <!-- 消息 -->
                                <div>{{ message }}</div>
                            </div>
                        </div>
                    `
        };

        // 挂载 Vue 应用到动态插入的 div 上
        _doc.myApp.vueInstance = new Vue({
          el: '#vue-app',
          data: App.data,
          template: App.template
        });
        myApp.foundSendBtn()
      }).catch(() => {
        // Vue 加载失败，显示通知
        myApp.error('Vue 加载失败，请检查网络或重试。', { autoClose: 5000 });
      });
    },
    notify: function (newMessage:string) {
      if (_doc.myApp.vueInstance) {
        // 更新 Vue 实例中的 message
        _doc.myApp.vueInstance.message = newMessage;
      } else {
        console.error('Vue 实例尚未初始化，请确保调用了 createApp 方法。');
      }
    },
    // 错误通知的方法
    error: function (message:string, options :{[key:string]:any} = {} as any) {
      let errorDiv = _doc.querySelector('#error-notification');

      if (!errorDiv) {
        // 如果不存在错误提示框，则创建
        errorDiv = _doc.createElement('div');
        errorDiv.id = 'error-notification';
        errorDiv.style.position = 'fixed';
        errorDiv.style.bottom = options.bottom || '10px';
        errorDiv.style.right = options.right || '10px';
        errorDiv.style.backgroundColor = options.backgroundColor || 'red';
        errorDiv.style.color = options.color || 'white';
        errorDiv.style.padding = options.padding || '10px';
        errorDiv.style.borderRadius = options.borderRadius || '5px';
        errorDiv.style.boxShadow = options.boxShadow || '0 0 10px rgba(0, 0, 0, 0.1)';
        errorDiv.style.zIndex = options.zIndex || 1000;
        errorDiv.style.display = 'flex';
        errorDiv.style.alignItems = 'center';

        // 创建关闭按钮
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;'; // 使用乘号表示关闭
        closeButton.style.marginLeft = '10px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontSize = '20px';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.padding = '0 5px';
        closeButton.style.color = options.closeButtonColor || 'white';

        // 点击关闭按钮时移除错误提示框
        closeButton.addEventListener('click', () => {
          if (errorDiv && errorDiv.parentNode) {
            document.body.removeChild(errorDiv);
          }
        });

        // 将关闭按钮添加到错误提示框中
        errorDiv.appendChild(closeButton);
        document.body.appendChild(errorDiv);
      }

      // 更新错误消息
      errorDiv.innerHTML = `${message}`;

      // 重新添加关闭按钮（覆盖内容时保持按钮存在）
      const closeButton = document.createElement('span');
      closeButton.innerHTML = '&times;';
      closeButton.style.marginLeft = '10px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.fontSize = '20px';
      closeButton.style.fontWeight = 'bold';
      closeButton.style.padding = '0 5px';
      closeButton.style.color = options.closeButtonColor || 'white';

      closeButton.addEventListener('click', () => {
        if (errorDiv && errorDiv.parentNode) {
          document.body.removeChild(errorDiv);
        }
      });

      errorDiv.appendChild(closeButton);

      // 自动移除通知（如果配置了 autoClose）
      if (options.autoClose) {
        setTimeout(() => {
          if (errorDiv && errorDiv.parentNode) {
            document.body.removeChild(errorDiv);
          }
        }, options.autoClose);
      }
    },
    foundSendBtn: () => {
      setTimeout(() => {
        let sendButton = document.querySelector('button[data-testid="send-button"]');
        console.log("查找发送按钮", sendButton, document)
        if (sendButton) {
          _doc.myApp.sendButton = sendButton;
          const mark = document.querySelector('form[type="button"]');
          if (myApp.currentLocation != mark) {
            (myApp.currentLocation as any) = mark;
            _doc.myApp.send(`
                            现在我发送要求给你，你可以写python或bash代码，我会执行你的代码，并返回执行结果你。你可以解析结果，并解读给我。对于python或bash的执行结果你可以自定义，比如json，字符串等。
                            对于某些情况，你可能需要我上传文件，此时你可以在打印中另起一行，以fileupload:['file1','file2']的格式输出，我看到了会解析里面的文件，并一并上传给你，对于文件，建议你都通过上传文件的方式处理。
                            对于报错没有相关组件时，我执行了代码之后，会把执行结果给你，你可以依据相关结果继续执行相关指令。
                            对于一些操作，bash执行更好，你可以尝试查看环境是否支持bash，如果支持，则可以优先使用bash命令。
                            为了你能更好的适应环境，建议你第一步先获取环境，比如操作系统、python环境等等
                            注意：1、我不会执行python或bash外的其他操作，因此你需要我做的，均需要写成python或bash代码，同时一次只能有一个python或bash代码块，一定要注意打印你需要的信息。我会执行后把执行结果给你，你需要自己解析以决定下一步操作。python或bash代码一定要完整，不要写不完整的代码。
                                2、除了我主动提供给你的环境，你需要的环境资料均可以通过python或bash代码执行后我给你。
                                3、所有操作只使用python或bash，对于多步操作，你可以分解python或bash代码执行循序，比如打开浏览器，你可以用python或bash打开，并在python或bash里输出打开结果，然后通过分析这个结果决定是否截图查看下部操作等。
                                4、千万不要把我本地环境和你的环境弄混，特别是你写的python或bash代码的环境，比如路径等。对于路径，你可以自己查看，不要用什么/path/to/your之类的占位符，也不要随意混用你的环境的mnt/data之类的。
                                5、对于需要我上传的文件，你需要用python代码执行为fileupload:['file1','file2']的格式之后我才能识别。请注意格式，不要随意添加空格之类。
                                6、用中文，除非必要的英语，其余情况不要用除中文外的其他语言
                                `);
          }
          let observer = new MutationObserver(function (mutationsList, observer) {
            for (let mutation of mutationsList) {
              // 检查按钮是否已经从 DOM 中被删除
              if (!document.body.contains(sendButton)) {
                console.log("Button was removed from the DOM.");
                observer.disconnect();  // 停止观察
                myApp.foundSendBtn()
                break;
              }
            }
          });
          myApp.notify("解释器已就绪")
          // 开始观察整个 body 元素，检测子节点变化
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        } else {
          myApp.foundSendBtn();
        }
      }, 1000)
    }
  }

  myApp.createApp();
  return "ok";
}
const webviewApi: any = getIpcApi('webview-api')
webviewApi.on("webviewApi.send-content", (event:any, message:any) => {
  console.log("搜到webview消息：", event, message)
  _doc.myApp.send(message)
})
js_bridge()