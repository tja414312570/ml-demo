from mitmproxy import http


# 这个函数会捕获所有响应
def response(flow: http.HTTPFlow) -> None:
    # 检查响应头中的 Content-Type，确保是 text/event-stream (SSE)
    content_type = flow.response.headers.get("Content-Type", "")

    if "text/event-stream" in content_type:
        print(f"Captured SSE from {flow.request.url}")
        # 获取响应体的数据流（SSE 是流式数据，可能会多次发送）
        sse_data = flow.response.text

        # 打印或保存 SSE 数据
        print("SSE Data:")
        print(sse_data)