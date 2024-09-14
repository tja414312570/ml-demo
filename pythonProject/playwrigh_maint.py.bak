import atexit
import os
import subprocess
import json
import threading
import time
from playwright.sync_api import sync_playwright

enable_mitm_proxy = False
mitm_port = 8080


# 启动 mitmproxy
def start_mitmproxy(port=mitm_port, upstream_proxy="127.0.0.1:7890"):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(current_dir, "event_stream.py")

    mitmproxy_process = subprocess.Popen(
        [
            "mitmdump",
            "-p", str(port),
            "-s", script_path,
            "--mode", f"upstream:http://{upstream_proxy}",
            "--ssl-insecure",
            "-v"
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        encoding='utf-8'
    )

    def log_output(pipe, stream_name):
        for line in iter(pipe.readline, ''):
            try:
                print(f"{stream_name}: {line.strip()}")
            except UnicodeDecodeError as e:
                print(f"UnicodeDecodeError in {stream_name}: {e}")
        pipe.close()

    stdout_thread = threading.Thread(target=log_output, args=(mitmproxy_process.stdout, 'MITM STDOUT'))
    stderr_thread = threading.Thread(target=log_output, args=(mitmproxy_process.stderr, 'MITM STDERR'))
    stdout_thread.start()
    stderr_thread.start()

    global enable_mitm_proxy
    enable_mitm_proxy = True

    def stop_mitmproxy():
        print("Terminating mitmproxy...")
        mitmproxy_process.terminate()
        mitmproxy_process.wait()
        print("mitmproxy terminated.")

    atexit.register(stop_mitmproxy)
    return mitmproxy_process


# 启动 Playwright 浏览器
def start_browser():
    playwright = sync_playwright().start()

    # 用户数据目录的配置
    current_dir = os.path.dirname(os.path.abspath(__file__))
    private_config_dir = os.path.join(current_dir, "private_chrome_config")
    if not os.path.exists(private_config_dir):
        os.makedirs(private_config_dir)

    # 启动浏览器
    browser = playwright.chromium.launch(
        headless=False,  # 显示浏览器
        args=['--auto-open-devtools-for-tabs']  # 自动打开开发者工具
    )

    # 创建新的浏览器上下文，使用用户数据目录
    browser_context = playwright.chromium.launch_persistent_context(
        private_config_dir,  # 设置用户数据目录
        headless=False,  # 显示浏览器
        args=['--auto-open-devtools-for-tabs'],  # 自动打开开发者工具
        ignore_https_errors=True,
        proxy={"server": f"http://127.0.0.1:{mitm_port}"} if enable_mitm_proxy else None
    )

    return browser_context, browser


# 注入 JavaScript 脚本
def inject_scripts(page):
    vue_js = """
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/vue@2';
    document.head.appendChild(script);
    """
    page.evaluate(vue_js)

    current_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(current_dir, "js_bridge.js")
    with open(script_path, "r") as file:
        js_content = file.read()

    page.evaluate(js_content)
    print("JavaScript 注入完成")


# 监听和处理 EventStream
def listen_for_event_stream(page):
    def handle_response(response):
        try:
            if response.request.resource_type == 'xhr' or response.request.resource_type == 'fetch':
                content_type = response.headers.get('content-type', '')
                if 'text/event-stream' in content_type:
                    body = response.body()
                    print(f"EventStream Data: {body}")
                    decode_event_stream(body)
        except Exception as e:
            print(f"Error processing response: {e}")

    # 监听网络响应
    page.on("response", handle_response)


# 解析 EventStream 数据
def decode_event_stream(data):
    events = data.split('\n\n')
    for event in events:
        if event.startswith('data:'):
            event_data = event[5:].strip()
            print(f"Received Event: {event_data}")
            # 处理 EventStream 数据
            process_event_data(event_data)


# 处理 EventStream 响应数据
def process_event_data(event_data):
    if event_data == '[DONE]':
        print("EventStream 完成")
    else:
        try:
            event_json = json.loads(event_data)
            print("处理的事件数据：", event_json)
        except json.JSONDecodeError:
            print(f"无法解析事件数据: {event_data}")


# 主流程
def main():
    # 启动 mitmproxy
    start_mitmproxy()

    # 启动浏览器并打开页面
    context, browser = start_browser()
    page = context.new_page()
    page.goto('https://share.github.cn.com/c/66e25e9f-b29c-8009-afa3-8e77a267a1ca')

    print("请手动登录...")
    time.sleep(5)  # 根据需要调整等待时间，确保页面加载和登录完成

    # 注入 JavaScript
    inject_scripts(page)

    # 监听 EventStream
    listen_for_event_stream(page)

    # 保持浏览器运行
    try:
        while True:
            time.sleep(2)
    except KeyboardInterrupt:
        print("Stopping...")
        browser.close()


if __name__ == '__main__':
    main()
