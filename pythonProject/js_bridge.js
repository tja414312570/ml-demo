(function() {
    document.myApp = {
        sendButton:null,
        send: function(message) {
            // 找到 textarea 元素
            let textarea = document.querySelector('textarea#prompt-textarea');

            // 清空 textarea 的内容并填写新内容
            if (textarea) {
                textarea.value = '';  // 清空
                textarea.value = message;  // 填写 message

                // 触发 input 事件，确保 React 或 Vue 等框架监听的事件能够捕捉到变化
                let inputEvent = new Event('input', { bubbles: true });
                textarea.dispatchEvent(inputEvent);
                 console.log("输入值完成",message)
            }

            // 找到具有 data-testid="send-button" 的按钮

            // 立即点击按钮
            console.log("发送按钮",document.myApp.sendButton,document)
            if (document.myApp.sendButton) {
                var loop = setInterval(()=>{
                    if(!document.myApp.sendButton.hasAttribute('disabled') && document.myApp.sendButton.getAttribute('data-testid') === 'send-button'){
                            document.myApp.sendButton.click();
                            console.log("按钮一点击",document.myApp.sendButton)
                            clearInterval(loop)
                    }else{
                        console.log("按钮不可用",document.myApp.sendButton)
                    }
                },500)

            }
        }
    }
    const foundSendBtn = () => {
        setTimeout(() => {
            let sendButton = document.querySelector('button[data-testid="send-button"]');
            console.log("查找发送按钮", sendButton, document)
            if (sendButton) {
                document.myApp.sendButton = sendButton;
                document.myApp.send("现在我发送要求给你，你可以写python代码，我会执行你的代码，并返回执行结果你，你可以解析结果，并解读给我，执行结果你可以自定义，比如json，字符串等。要求是只能有一个print");
                 let observer = new MutationObserver(function(mutationsList, observer) {
                    for (let mutation of mutationsList) {
                        // 检查按钮是否已经从 DOM 中被删除
                        if (!document.body.contains(sendButton)) {
                            console.log("Button was removed from the DOM.");
                            observer.disconnect();  // 停止观察
                            foundSendBtn()
                            break;
                        }
                    }
                });

                // 开始观察整个 body 元素，检测子节点变化
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            } else {
                foundSendBtn();
            }
        }, 1000)
    };
    foundSendBtn()
    alert("hello world");
    return "ok";
})();
