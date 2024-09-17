import atexit
import contextlib
import inspect
import logging
import os
import subprocess
import json
import tempfile
import threading
import asyncio
import socket
from logging import log

from playwright.async_api import async_playwright
import traceback

import sys
import io
import re
import ast

mitm_port = 8080
HOST = 'localhost'
PORT = 65432  # 定义 socket 服务器监听的端口

logging.basicConfig(
    filename='logfile.log',  # 指定日志文件名
    filemode='a',  # 追加模式写入日志文件，默认为覆盖
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
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
                logging.info(f"{stream_name}: {line.strip()}")

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

async def execute_python_code(code):
    try:
        print(f"执行python代码{code}")
        # 创建一个临时文件，用于存储 Python 代码
        with tempfile.NamedTemporaryFile(delete=False, suffix='.py') as temp_py_file:
            temp_py_file.write(code.encode('utf-8'))
            temp_file_path = temp_py_file.name

        env = os.environ.copy()
        env["https_proxy"] = "http://127.0.0.1:7890"
        env["http_proxy"] = "http://127.0.0.1:7890"
        env["all_proxy"] = "socks5://127.0.0.1:7890"
        # 使用 asyncio.create_subprocess_exec 来异步执行代码
        process = await asyncio.create_subprocess_exec(
            sys.executable, temp_file_path,  # sys.executable 指向当前的 Python 解释器
            stdout=asyncio.subprocess.PIPE,  # 捕获标准输出
            stderr=asyncio.subprocess.PIPE,   # 捕获标准错误
            env=env
        )

        # 实时读取子进程的 stdout 和 stderr
        output = ""
        while True:
            # 逐行读取 stdout 和 stderr
            stdout_line = await process.stdout.readline()
            stderr_line = await process.stderr.readline()

            if stdout_line:
                stdout_line = stdout_line.decode('utf-8')
                print(stdout_line, end='')  # 实时打印 stdout
                output += stdout_line

            if stderr_line:
                stderr_line = stderr_line.decode('utf-8')
                print(stderr_line, end='')  # 实时打印 stderr
                output += f"\nError: {stderr_line}"

            # 如果 stdout 和 stderr 都已结束，退出循环
            if process.stdout.at_eof() and process.stderr.at_eof():
                break

        # 确保子进程已经完成
        await process.wait()

        return output

    except Exception as e:
        return f"执行代码时出错: {str(e)}"

    finally:
        # 确保删除临时文件
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

async def run_shell_command(command):
    print(f"执行shell命令: {command}")
    try:
         # 设置代理环境变量
        env = os.environ.copy()
        env["https_proxy"] = "http://127.0.0.1:7890"
        env["http_proxy"] = "http://127.0.0.1:7890"
        env["all_proxy"] = "socks5://127.0.0.1:7890"

        # 启动子进程
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,  # 将 stderr 合并到 stdout
            shell=True,
            universal_newlines=True,
            bufsize=1,  # 行缓冲
            env=env  # 使用设置了代理的环境变量
        )

        all_output = ""

        # 实时读取输出
        for stdout_line in iter(process.stdout.readline, ""):
            print(stdout_line, end='', flush=True)  # 实时打印
            all_output += stdout_line  # 记录输出

        process.stdout.close()
        process.wait()

        return all_output
    except Exception as e:
        return f"执行shell时出错: {str(e)}"

async def execute_python_code_exec(code):
    try:
        # 创建一个字符串流来捕获 exec 中的输出
        new_stdout = io.StringIO()

        # 使用 contextlib.redirect_stdout 只在 exec 时重定向输出到 new_stdout
        with contextlib.redirect_stdout(new_stdout):
            # 执行传入的代码，并获取返回值
            local_vars = {}
            exec(code, {}, local_vars)  # 使用 local_vars 存储局部变量

        # 检查是否有返回的 coroutine 需要 await
        result = local_vars.get('result')
        if inspect.iscoroutine(result):
            result = await result  # 如果是 coroutine，则 await 它

        # 获取 exec 中的输出
        output = new_stdout.getvalue()

        # 如果存在 result，则将其加入到输出中
        if result is not None:
            output += f"\nResult: {result}"

    except Exception as e:
        # 捕获 exec 中的异常并返回
        output = f"执行代码时出错: {str(e)}"

    return output


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
                await dispatcher_result(full_error_report, True)
                return None
        else:
            # 没有匹配到 fileupload 列表
            error_message = "未找到 fileupload 列表。"
            print(error_message)
            # await dispatcher_result(error_message,True)
            return None
    except Exception as e:
        # 捕获其他异常并生成完整的错误报告
        error_message = f"处理 fileupload 列表时出错: {str(e)}，数据：{result_string}"
        error_traceback = traceback.format_exc()  # 获取详细的错误栈
        full_error_report = f"{error_message}\n错误栈：\n{error_traceback}"
        print(full_error_report)
        # 使用 dispatcher_result 发送错误报告
        await dispatcher_result(full_error_report, True)
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

def process_invoke_arguments(invoke_arguments):
    if not invoke_arguments or invoke_arguments.strip() == '""':  # 检查字符串是否为空
        invoke_arguments = "没有任何输出"
    if isinstance(invoke_arguments, str):
        # 对 param 进行适当的转义，避免引号冲突
        if not (invoke_arguments.startswith('"') and invoke_arguments.endswith('"')):
            # 给字符串加上开头和结尾的双引号
            invoke_arguments = f'`{invoke_arguments.replace('`', '\\`')}`'
    return invoke_arguments

# 处理 EventStream 数据
async def dispatcher_result(param, is_decode_result=False):
    global page_context
    if not is_decode_result:
        upload_files = await decode_result(param)
        if upload_files and len(upload_files) > 0:
            await upload_file(upload_files)
    vue_js = f"""
            document.myApp.send({process_invoke_arguments(param)})
        """
    print(f"执行代码:{vue_js}")
    await page_context.evaluate(vue_js)


def extract_code_blocks_from_markdown(server_output):
    """
    提取 Markdown 文本中的所有代码块，并按顺序返回。

    :param server_output: 包含 Markdown 文本的字符串
    :return: 一个包含 (代码类型, 代码块) 的列表
    """
    # 正则表达式匹配 ```python 和 ```bash 代码块
    pattern = re.compile(r"```(python|bash)\n(.*?)```", re.DOTALL)
    code_blocks = pattern.findall(server_output)

    # 返回的列表包含 (语言类型, 代码块) 的元组
    return code_blocks


async def dispatcher_response(response_data):
    print(f"处理命令: {response_data}")
    await notify_app(f"处理命令: {response_data}")

    # 提取所有代码块
    code_blocks = extract_code_blocks_from_markdown(response_data)

    if code_blocks:
        for language, code in code_blocks:
            if language == 'python':
                print(f"检测到的 {language}代码:\n{code}")
                await notify_app(f"检测到的 {language}代码:\n{code}")
                result = await execute_python_code(code)
                print(f"执行结果:\n{result}")
                await notify_app(f"执行{language}结果:\n{result}")
                await dispatcher_result(json.dumps(result))
            elif language == 'bash':
                print(f"检测到的 {language}代码:\n{code}")
                await notify_app(f"检测到的 {language}代码:\n{code}")
                result = await run_shell_command(code)  # 假设有 execute_bash_code 函数
                print(f"执行{language}结果:\n{result}")
                await notify_app(f"执行{language}完成")
                await dispatcher_result(json.dumps(result))
            else:
                await notify_app(f"不支持的代码{language}")
    else:
        print("未检测到代码块")
        await notify_app(f"未检测到代码块")



# {"code":"success","body":"python执行结果"}
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
    current_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(current_dir, "js_bridge.js")
    with open(script_path, "r") as file:
        js_content = file.read()

    await page.evaluate(js_content)
    print("JavaScript 注入完成")

async def notify_app(message):
    js_template = f"""
                document.myApp.notify({process_invoke_arguments(message)})
            """
    await invoke_js(js_template)

async def invoke_js(invoke_js):
    global page_context
    print(f"执行js代码:\n{invoke_js}")
    await page_context.evaluate(invoke_js)
async def notify_app_error(message):
    js_template = f"""
                document.myApp.error({process_invoke_arguments(message)})
            """
    await invoke_js(js_template)

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

    await page.goto('https://share.github.cn.com/')

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
