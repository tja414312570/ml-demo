import atexit
import os
import subprocess
import json
import threading
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities


enable_mitm_proxy = False
mitm_port = 8080

current_data = ''

# 启动 mitmproxy
def start_mitmproxy(port=mitm_port, upstream_proxy="127.0.0.1:7890"):
    # 获取当前程序所在目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # 将 event_stream.py 放在当前目录
    script_path = os.path.join(current_dir, "event_stream.py")

    # 使用 subprocess 启动 mitmproxy 并配置上游代理
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
        encoding='utf-8'  # 确保输出是字符串而不是字节
    )

    def log_output(pipe, stream_name):
        for line in iter(pipe.readline, ''):
            try:
                print(f"{stream_name}: {line.strip()}")
            except UnicodeDecodeError as e:
                print(f"UnicodeDecodeError in {stream_name}: {e}")
        pipe.close()

        # 启动线程来处理 stdout 和 stderr

    stdout_thread = threading.Thread(target=log_output, args=(mitmproxy_process.stdout, 'MITM STDOUT'))
    stderr_thread = threading.Thread(target=log_output, args=(mitmproxy_process.stderr, 'MITM STDERR'))
    stdout_thread.start()
    stderr_thread.start()
    print(f"Started mitmproxy on port {port} with script {script_path} and upstream proxy {upstream_proxy}")
    global enable_mitm_proxy
    enable_mitm_proxy = True

    def stop_mitmproxy():
        print("Terminating mitmproxy...")
        mitmproxy_process.terminate()
        mitmproxy_process.wait()
        print("mitmproxy terminated.")

    atexit.register(stop_mitmproxy)

    return mitmproxy_process


# 配置 Selenium 使用的代理和其他选项
def configure_selenium():
    options = webdriver.ChromeOptions()
    if enable_mitm_proxy:
        options.add_argument(f'--proxy-server=http://127.0.0.1:{mitm_port}')  # 设置代理为 mitmproxy
        print("Selenium is configured to use mitmproxy.")

    options.add_argument('--disable-web-security')
    options.add_argument('--disable-features=IsolateOrigins,site-per-process')
    options.add_argument('--disable-site-isolation-trials')
    options.add_argument("--auto-open-devtools-for-tabs")
    options.add_argument('--disable-gpu')
    options.add_argument('--disable-web-security')
    options.add_argument('--disable-site-isolation-trials')
    options.add_argument('--allow-running-insecure-content')
    options.add_argument('--no-sandbox')
    options.add_argument('--ignore-certificate-errors')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-extensions')

    # 配置 Chrome 用户数据目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    private_config_dir = os.path.join(current_dir, "private_chrome_config")
    if not os.path.exists(private_config_dir):
        os.makedirs(private_config_dir)
    options.add_argument(f"--user-data-dir={private_config_dir}")
    options.add_argument(r'--profile-directory=Default')

    # 配置性能日志捕获
    capabilities = DesiredCapabilities.CHROME.copy()
    capabilities['goog:loggingPrefs'] = {'performance': 'ALL'}
    options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})

    return options


# 启动 Selenium WebDriver
def start_selenium(options):
    service = Service('C:/Users/tja41/Desktop/chromedriver-win64/chromedriver.exe')  # 修改为你的 ChromeDriver 路径
    driver = webdriver.Chrome(service=service, options=options)
    driver.execute_cdp_cmd('Network.enable', {})
    return driver


# 监听和处理 EventStream 响应
def listen_for_event_stream(driver):
    logs = driver.get_log('performance')
    for entry in logs:
        log = json.loads(entry['message'])['message']
        if log['method'] == 'Network.responseReceived':
            url = log['params']['response']['url']
            request_id = log['params']['requestId']
            resource_type = log['params']['type'].lower()

            # 只处理 XHR 和 fetch 请求
            if resource_type in ['xhr', 'fetch']:
                headers = {k.lower(): v for k, v in log['params']['response']['headers'].items()}
                content_type = headers.get('content-type', '')

                # 检查是否为 EventStream 响应
                if 'text/event-stream' in content_type:
                    process_event_stream(driver, request_id, url)


# 处理 EventStream 响应
def process_event_stream(driver, request_id, url):
    try:
        response_body = driver.execute_cdp_cmd('Network.getResponseBody', {'requestId': request_id})
        data = response_body.get('body', None)
        if data:
            print("EventStream Data Received:")
            decode_event_stream(data)
        else:
            print(f"No EventStream data found for the given request ID: {request_id}.")
    except Exception as e:
        print(f"Error processing EventStream for {url}: {e}")


# 解析 EventStream 数据
def process_response(current_data):
    print('处理命令:', current_data)
    parsed_data = json.loads(current_data)

    # 提取 message 部分
    message = parsed_data.get('message', {})

    # 打印解析出的 message
    print("Message ID:", message.get('id'))
    print("Author Role:", message.get('author', {}).get('role'))
    print("Content:", message.get('content', {}).get('parts', [])[0])
    print("Status:", message.get('status'))
    print("Conversation ID:", parsed_data.get('conversation_id'))
    pass


def decode_event_stream(data):
    global current_data
    events = data.split('\n\n')
    for event in events:
        if event.startswith('data:'):
            event_data = event[5:].strip()
            try:
                print('Received Event:', event_data)
                if event_data == '[DONE]':
                    process_response(current_data)
                elif '"finished_successfully"' in event_data:
                    current_data = event_data
            except json.JSONDecodeError:
                print(f"Failed to parse event data: {event_data}")


# 主循环监听日志并处理事件流
def main():
    # 启动 mitmproxy
    start_mitmproxy()

    # 配置并启动 Selenium
    options = configure_selenium()
    driver = start_selenium(options)

    # 打开目标网页
    driver.get('https://share.github.cn.com/c/66e25e9f-b29c-8009-afa3-8e77a267a1ca')
    print("Please log in manually if required...")
    time.sleep(5)  # 根据需要调整等待时间，确保登录完成
    vue_js = """
       var script = document.createElement('script');
       script.src = 'https://cdn.jsdelivr.net/npm/vue@2';
       document.head.appendChild(script);
       """
    driver.execute_script(vue_js)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # 将 event_stream.py 放在当前目录
    script_path = os.path.join(current_dir, "js_bridge.js")
    with open(script_path, "r") as file:
        js_content = file.read()

    # 将文件内容作为字符串注入到浏览器中
    vue_js = f"""
    var scriptContent = `{js_content}`;
    eval(scriptContent);
    """
    result = driver.execute_script(vue_js)
    print(f'js执行结果{result}')
    # 监听 EventStream
    try:
        while True:
            listen_for_event_stream(driver)
            time.sleep(2)  # 定期检查日志
    except KeyboardInterrupt:
        print("Stopping...")
        driver.quit()


if __name__ == '__main__':
    main()
