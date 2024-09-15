import socket
from mitmproxy import http
import json

HOST = 'localhost'  # 主程序运行的服务器地址
PORT = 65432        # 主程序监听的端口

# 全局变量，用于存储 socket 连接
client_socket = None

# 在 mitmproxy 启动时创建 socket 连接并发送启动成功信号
def load(l):
    global client_socket
    create_socket_connection()

def create_socket_connection():
    global client_socket
    try:
        client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client_socket.connect((HOST, PORT))
        print(f"Socket connected to {HOST}:{PORT}")
        # 发送启动成功信号
        send_to_socket_server("MITM_READY")
        print("mitmproxy 已发送启动成功信号")
    except Exception as e:
        print(f"Failed to connect to socket server: {e}")
        client_socket = None

# 该函数会捕获所有 HTTP 响应
def response(flow: http.HTTPFlow) -> None:
    global client_socket
    content_type = flow.response.headers.get("Content-Type", "")

    if "text/event-stream" in content_type:
        print(f"Captured SSE from {flow.request.url}")

        # 获取响应体的数据流（SSE 是流式数据，可能会多次发送）
        sse_data = flow.response.text

        events = sse_data.split("\n\n")

        # 遍历每个事件并单独发送
        for event in events:
            if event.startswith("data:"):
                # 去除 'data:' 前缀，并整理数据
                event_data = event[5:].strip()

                data = {
                    'url': flow.request.url,
                    'headers': dict(flow.request.headers),
                    'body': event_data
                }

                # 打印 SSE 事件数据
                print(f"SSE Event Data:\n{event_data}")

                # 将数据发送到主程序的 socket 服务器
                if client_socket:
                    try:
                        send_to_socket_server(data)
                    except BrokenPipeError:
                        print("Broken pipe error, attempting to reconnect...")
                        create_socket_connection()  # 尝试重连
                        if client_socket:
                            send_to_socket_server(data)  # 重新发送数据
                else:
                    print("Socket is not available. Data could not be sent.")

# 将数据发送到 socket 服务器
def send_to_socket_server(data):
    global client_socket
    try:
        if not isinstance(data, str):
            json_data = json.dumps(data)
        else:
            json_data = data  # 如果已经是字符串，直接使用
        message = json_data + "\0"  # 添加换行符作为分隔符
        client_socket.sendall(message.encode('utf-8'))
        print("Data sent to socket server")
    except Exception as e:
        print(f"Failed to send data to socket server: {e}")
