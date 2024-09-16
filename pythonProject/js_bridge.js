(function() {
    document.myApp = {
        sendButton:null,
        send: function(message) {
            // 找到 textarea 元素
            let textarea = document.querySelector('#prompt-textarea');

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
                    console.error("元素既不是 textarea 也不是 contenteditable 的 div",textarea);
                    alert("输入框不支持")
                    return;
                }
                // 触发 input 事件，确保 React 或 Vue 等框架监听的事件能够捕捉到变化
                let inputEvent = new Event('input', { bubbles: true });
                textarea.dispatchEvent(inputEvent);
                 console.log("输入值完成",message)
            }else{
                alert("没有找到输入框")
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
                        if(textarea == null || textarea.value === ''){
                            clearInterval(loop)
                        }
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
                document.myApp.send(`
                现在我发送要求给你，你可以写python代码，我会执行你的代码，并返回执行结果你，你可以解析结果，并解读给我，执行结果你可以自定义，比如json，字符串等。要求是只能有一个print。
                对于某些情况，你可能需要我上传文件，此时你可以在打印中另起一行，以fileupload:['file1','file2']的格式输出，我看到了会解析里面的文件，并一并上传给你，对于文件，建议你都通过上传文件的方式处理
                对于报错没有相关组件时，你可以通过python代码执行bash命令或其他安装组件命令，我执行了代码之后，会把执行结果给你，你可以依据python结果继续执行相关指令
                注意：1、我不会执行python外的其他操作，因此你需要我做的，均需要写成python代码，同时一次只能有一个python代码块，一定要注意打印你需要的信息。我会执行后把执行结果给你，你需要自己解析以决定下一步操作。python代码一定要完整，不要写不完整的代码
                    2、除了我主动提供给你的环境，你需要的环境资料均可以通过python代码执行后我给你
                    3、所有操作只使用python，对于多步操作，你可以分解python代码执行循序，比如打开浏览器，你可以用python打开，并在python里输出打开结果，然后通过分析这个结果决定是否截图查看下部操作等
                    4、千万不要把我本地环境和你的环境弄混，特别是你写的python代码的环境，比如路径等。对于路径，你可以自己查看，不要用什么/path/to/your之类的，也不要用什么mnt/data之类的
                    5、对于需要我上传的文件，你需要用python代码执行为fileupload:['file1','file2']的格式之后我才能识别。请注意格式，不要随意添加空格之类
                    6、用中文，除非必要的英语，其余情况不要用除中文外的其他语言
                    7、bash请用下列格式 
                    import subprocess
                    def run_shell_command(command):
                        # 使用 unbuffer 确保输出不被缓存
                        process = subprocess.Popen(
                            f"{command}",  # 使用 unbuffer 确保输出不会被缓冲
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE,
                            shell=True,
                            universal_newlines=True,
                            bufsize=1  # 行缓冲
                        )
                    
                        all_output = ""
                    
                        # 实时读取 stdout 和 stderr
                        while True:
                            stdout_line = process.stdout.readline()
                            stderr_line = process.stderr.readline()
                    
                            if stdout_line:
                                print(stdout_line, end='')  # 实时打印 stdout
                                all_output += stdout_line   # 记录 stdout 输出
                    
                            if stderr_line:
                                print(stderr_line, end='')  # 实时打印 stderr
                                all_output += stderr_line   # 记录 stderr 输出
                    
                            if stdout_line == '' and stderr_line == '' and process.poll() is not None:
                                break
                    
                        process.stdout.close()
                        process.stderr.close()
                    
                        return all_output
                    
                    # 示例命令
                    command = "your command here"
                    output = run_shell_command(command)
                    print("\\n命令的完整输出：")
                    print(output)

                    `);
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
