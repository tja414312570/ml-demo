import atexit
import contextlib
import os
import subprocess
import json
import threading
import asyncio
import socket
from playwright.async_api import async_playwright
import traceback

import sys
import io
import re
import ast

mitm_port = 8080
HOST = 'localhost'
PORT = 65432  # 定义 socket 服务器监听的端口

# 用于同步 mitmproxy 启动信号
mitm_ready_event = threading.Event()

response_data = None

page_context = None

# 启动 mitmproxy
def start_mitmproxy(port=mitm_port, upstream_proxy="127.0.0.1:7890"):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(current_dir, "event_stream.py")  # 替换为你的 mitmproxy 脚本路径

    # 启动 mitmproxy，并加载脚本
    mitmproxy_process = subprocess.Popen(
        [
            "mitmdump",
            "-p", str(port),
            "-s", script_path,  # 启动 mitmproxy 脚本
            "--mode", f"upstream:http://{upstream_proxy}",
            "--ssl-insecure",
            "-v"
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        encoding='utf-8'
    )

    # 处理 stdout 和 stderr 的输出，避免阻塞
    def log_output(pipe, stream_name):
        with pipe:
            for line in iter(pipe.readline, ''):
                print(f"{stream_name}: {line.strip()}")

    stdout_thread = threading.Thread(target=log_output, args=(mitmproxy_process.stdout, 'MITM STDOUT'))
    stderr_thread = threading.Thread(target=log_output, args=(mitmproxy_process.stderr, 'MITM STDERR'))
    stdout_thread.daemon = True
    stderr_thread.daemon = True
    stdout_thread.start()
    stderr_thread.start()

    def stop_mitmproxy():
        print("Terminating mitmproxy...")
        mitmproxy_process.terminate()
        mitmproxy_process.wait()
        print("mitmproxy terminated.")

    atexit.register(stop_mitmproxy)
    return mitmproxy_process


# 启动 socket 服务器
def start_socket_server(loop):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server_socket:
        # 允许端口复用，防止程序重启时端口被占用
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

        server_socket.bind((HOST, PORT))
        server_socket.listen()
        print(f"Socket server listening on {HOST}:{PORT}")

        while True:
            conn, addr = server_socket.accept()  # 接受客户端连接
            print(f"Connected by {addr}")
            threading.Thread(target=handle_client, args=(conn, loop)).start()


# 处理客户端连接，接收数据
def handle_client(conn, loop):
    global mitm_ready_event
    buffer = ""

    with conn:
        while True:
            try:
                # 每次接收一部分数据
                data = conn.recv(4096)
                if not data:
                    break

                buffer += data.decode('utf-8')

                # 检查是否有完整的消息（通过换行符分割）
                while "\0" in buffer:
                    line, buffer = buffer.split("\0", 1)  # 按行分割
                    print(f"Received data: {line}")

                    # 如果接收到启动成功信号，则触发事件，解除阻塞
                    if line == "MITM_READY":
                        print("mitmproxy 已准备好")
                        mitm_ready_event.set()  # 设置事件，表示 mitmproxy 已经启动
                        break  # 不再继续等待

                    # 其他数据处理逻辑
                    asyncio.run_coroutine_threadsafe(process_event_data(line), loop)

            except Exception as e:
                print(f"Error receiving data from client: {e}")
                break  # 连接异常时退出循环


class Tee:
    """实现同时将输出写入多个流的类，比如 sys.stdout 和 StringIO"""
    def __init__(self, *streams):
        self.streams = streams

    def write(self, data):
        for stream in self.streams:
            stream.write(data)

    def flush(self):
        for stream in self.streams:
            stream.flush()

def execute_python_code(code):
    try:
        # 创建一个字符串流来捕获 exec 中的输出
        new_stdout = io.StringIO()

        # 使用 contextlib.redirect_stdout 只在 exec 时重定向输出到 new_stdout
        with contextlib.redirect_stdout(new_stdout):
            # 执行传入的代码
            exec(code)

        # 获取 exec 中的输出
        output = new_stdout.getvalue()

    except Exception as e:
        # 捕获 exec 中的异常并返回
        output = f"执行代码时出错: {str(e)}"

    return output

def extract_python_code_from_markdown(server_output):
    # 查找代码块的标记
    if "```python" in server_output:
        # 找到代码块的开始和结束
        start_index = server_output.find("```python") + len("```python")
        end_index = server_output.find("```", start_index)

        # 提取代码块
        python_code = server_output[start_index:end_index].strip()
        return python_code
    return None


async def upload_file(file_path):
    global page_context
    input_file = await page_context.query_selector('input[type="file"]')
    print("上传文件路径")
    # 上传指定路径下的文件
    await input_file.set_input_files(file_path)


async def decode_result(result_string):
    try:
        # 使用正则表达式提取 fileupload 列表
        match = re.search(r"fileupload:\[(.*?)\]", result_string)

        if match:
            # 获取匹配到的内容，并将其转换为有效的 Python 列表
            array_str = f"[{match.group(1)}]"  # 添加中括号使其成为有效的 Python 列表形式

            try:
                # 尝试使用 ast.literal_eval 解析为 Python 列表
                file_list = ast.literal_eval(array_str)
                return file_list
            except (SyntaxError, ValueError) as e:
                # 捕获解析错误并提供详细的错误信息
                error_message = f"解析 fileupload 列表时出错: {str(e)}，数据：{array_str}"
                error_traceback = traceback.format_exc()  # 获取详细的错误栈
                full_error_report = f"{error_message}\n错误栈：\n{error_traceback}"
                print(full_error_report)
                # 使用 dispatcher_result 发送错误报告
                await dispatcher_result(full_error_report,True)
                return None
        else:
            # 没有匹配到 fileupload 列表
            error_message = "未找到 fileupload 列表。"
            print(error_message)
            await dispatcher_result(error_message,True)
            return None
    except Exception as e:
        # 捕获其他异常并生成完整的错误报告
        error_message = f"处理 fileupload 列表时出错: {str(e)}，数据：{result_string}"
        error_traceback = traceback.format_exc()  # 获取详细的错误栈
        full_error_report = f"{error_message}\n错误栈：\n{error_traceback}"
        print(full_error_report)
        # 使用 dispatcher_result 发送错误报告
        await dispatcher_result(full_error_report,True)
        return None


# 处理 EventStream 数据
async def process_event_data(event_data):
    try:
        # 首先尝试将收到的字符串转换为 JSON
        await process_json_data(json.loads(event_data))
    except json.JSONDecodeError as e:
        # 处理 JSON 格式错误
        error_message = f"处理数据时出错: JSON 格式错误: {str(e)}，数据：{event_data}"
        error_traceback = traceback.format_exc()  # 获取错误栈
        full_error_report = f"{error_message}\n错误栈：\n{error_traceback}"
        print(full_error_report)  # 打印到控制台
        await dispatcher_result(full_error_report)  # 通过 dispatcher_result 发送错误报告
    except Exception as e:
        # 捕获其他异常
        error_message = f"处理数据时出错: {str(e)}，数据：{event_data}"
        error_traceback = traceback.format_exc()  # 获取错误栈
        full_error_report = f"{error_message}\n错误栈：\n{error_traceback}"
        print(full_error_report)  # 打印到控制台
        await dispatcher_result(full_error_report)  # 通过 dispatcher_result 发送错误报告

# 处理 EventStream 数据
async def dispatcher_result(param,is_decode_result = False):
    global page_context
    if is_decode_result:
        upload_files = await decode_result(param)
        if upload_files and len(upload_files) > 0:
            await upload_file(upload_files)
    vue_js = f"""
        document.myApp.send({param})
        """
    print(f"执行代码:{vue_js}")
    await page_context.evaluate(vue_js)


async def dispatcher_response(response_data):
    print(f"处理命令: {response_data}")
    python_code = extract_python_code_from_markdown(response_data)

    # 如果提取到了 Python 代码，执行它
    if python_code:
        print(f"检测到的 Python 代码:\n{python_code}")
        result = execute_python_code(python_code)
        print(f"执行结果:\n{result}")
        await dispatcher_result(json.dumps(result))
    else:
        print("未检测到 Python 代码块")
#{"code":"success","body":"python执行结果"}
async def process_json_data(event_json):
    global response_data
    # 处理 headers 并转换为中文
    headers = event_json.get('headers', {})
    body = event_json.get('body', '')

    # 将 headers 转换为中文输出
    print("收到的请求头信息：")
    for key, value in headers.items():
        if key == "content-length":
            print(f"内容长度: {value}")
        elif key == "authorization":
            print(f"授权: {value[:10]}...（部分隐藏）")
        elif key == "accept":
            print(f"接受内容类型: {value}")
        elif key == "referer":
            print(f"来源页面: {value}")
        elif key == "cookie":
            print(f"Cookie 信息: {value[:30]}...（部分隐藏）")
        else:
            print(f"{key}: {value}")

    # 处理 body 并转换为中文输出
    print("\n收到的消息内容：")
    if body:
        if body == '[DONE]':
            print(f"EventStream 完成，等待处理数据:{response_data}")
            await dispatcher_response(response_data)
            return
        else:
            body_data = json.loads(body)
            message = body_data.get("message", {})
            content = message.get("content", {}).get("parts", [""])[0]
            print(f"消息内容: {content}")
            if len(content) > 0:
                response_data = content
            # 处理其他消息元数据
            metadata = message.get("metadata", {})
            if "model_slug" in metadata:
                print(f"模型类型: {metadata['model_slug']}")
            if "model_switcher_deny" in metadata:
                deny_reasons = metadata["model_switcher_deny"]
                for deny in deny_reasons:
                    print(f"模型切换原因: {deny.get('description', '')}")

    print("\n完整数据已处理为中文输出\n")


async def inject_scripts(page):
    vue_js = """
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/vue@2';
    document.head.appendChild(script);
    """
    await page.evaluate(vue_js)

    current_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(current_dir, "js_bridge.js")
    with open(script_path, "r") as file:
        js_content = file.read()

    await page.evaluate(js_content)
    print("JavaScript 注入完成")
# 启动 Playwright 浏览器
async def start_browser():
    playwright = await async_playwright().start()  # 确保正确启动 Playwright

    # 用户数据目录的配置
    current_dir = os.path.dirname(os.path.abspath(__file__))
    private_config_dir = os.path.join(current_dir, "private_chrome_config")  # 恢复用户数据目录
    if not os.path.exists(private_config_dir):
        os.makedirs(private_config_dir)

    # 启动带持久性上下文的浏览器，并配置代理
    browser_context = await playwright.chromium.launch_persistent_context(
        private_config_dir,  # 用户数据目录
        headless=False,  # 显示浏览器
        args=['--auto-open-devtools-for-tabs'],  # 自动打开开发者工具
        ignore_https_errors=True,  # 忽略 HTTPS 错误
        proxy={"server": f"http://127.0.0.1:{mitm_port}"}  # 使用代理
    )

    return browser_context, browser_context.browser  # 返回上下文和浏览器实例


# 主流程
async def main():
    # 启动 socket 服务器线程
    loop = asyncio.get_running_loop()
    server_thread = threading.Thread(target=start_socket_server, args=(loop,))
    server_thread.daemon = True
    server_thread.start()

    # 启动 mitmproxy
    mitmproxy_process = start_mitmproxy()

    # 阻塞等待 mitmproxy 启动完成的信号
    print("等待 mitmproxy 启动完成...")
    mitm_ready_event.wait()  # 等待事件被 set，表示 mitmproxy 已准备好
    print("mitmproxy 已启动，开始启动浏览器")

    # 启动浏览器并打开页面
    context, browser = await start_browser()
    page = await context.new_page()
    global page_context
    page_context = page

    await page.goto('https://share.github.cn.com/c/66e6d585-d3a0-8013-bb55-f6cc660458ef')

    print("请手动登录...")
    await asyncio.sleep(5)  # 等待用户手动登录
    # 注入 JavaScript
    await inject_scripts(page)

    # 优雅的等待方式，直到某个外部事件触发或按下 Ctrl+C
    stop_event = asyncio.Event()
    try:
        await stop_event.wait()  # 等待直到手动触发
    except KeyboardInterrupt:
        print("Stopping...")

    await browser.close()


# 启动异步主函数
if __name__ == '__main__':
    asyncio.run(main())
