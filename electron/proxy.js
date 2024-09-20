import { ProxyServer } from 'anyproxy';
import fs from 'fs';
import path from 'path';
import { HttpProxyAgent } from 'http-proxy-agent';
import { fileURLToPath } from 'url';

// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日志文件路径
const logFilePath = path.join(__dirname, 'proxy_logs.txt');

// 写日志到文件的辅助函数
function logToFile(data) {
  fs.appendFile(logFilePath, data + '\n', (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
}

export async function startProxyServer(upstreamProxy) {
  const rule = {
    // 拦截并写入请求体
    *beforeSendRequest(requestDetail) {
      const requestData = requestDetail.requestData.toString();
      const logData = `Request intercepted: ${requestDetail.url}\nRequest Body: ${requestData}\n`;
      
      // 写日志到文件
      logToFile(logData);
      if (requestDetail.protocol == "http") {
        var proxy = process.env.http_proxy || upstreamProxy.protocol + '://' + upstreamProxy.host + ':' + upstreamProxy.port;
        var agent = new HttpProxyAgent(proxy);
        const newRequestOptions = requestDetail.requestOptions;
        newRequestOptions.agent = agent;
        return requestDetail;
    }
    else if (requestDetail.protocol == "https") {
        var proxy = process.env.http_proxy || upstreamProxy.protocol + '://' + upstreamProxy.host + ':' + upstreamProxy.port;
        var agent = new HttpProxyAgent(proxy);
        const newRequestOptions = requestDetail.requestOptions;
        newRequestOptions.agent = agent;
        return requestDetail;
    }
    //   return null; // 不修改请求
    },
    // 拦截并写入响应体
    *beforeSendResponse(requestDetail, responseDetail) {
      const contentType = responseDetail.response.header['Content-Type'] || '';
      const responseBody = responseDetail.response.body;

      // 将响应体保存到日志文件
      const logData = `Response for: ${requestDetail.url}\nResponse Body (Buffer): ${responseBody}\n`;

      // 写日志到文件
      logToFile(logData);

      // 如果还想将 Buffer 转为字符串再保存
      const originalBodyAsString = responseBody.toString();
      const logDataAsString = `Response Body (String): ${originalBodyAsString}\n`;

      // 写日志到文件
      logToFile(logDataAsString);

      return null;  // 不修改响应体，保持原样返回
    }
  };

  // 配置代理服务器
  const proxyOptions = {
    port: 3001,
    rule, // 使用自定义规则
    forceProxyHttps: true, // 强制代理 HTTPS
    silent: false, // 输出日志
    webInterface: {
      enable: true, // 启用 Web 界面（调试用）
      webPort: 8002,
    },
    throttle: 10000,  // 设置带宽限制，避免超时
    wsIntercept: false,  // 不拦截 WebSocket 请求
    silent: true,  // 关闭详细日志输出
    caCertDir: path.join(__dirname, 'certs') // 指定证书目录
  };

  // 如果有上游代理，设置上游代理配置
  if (upstreamProxy) {
    proxyOptions.upstreamProxy = {
      host: upstreamProxy.host,
      port: upstreamProxy.port,
      isHttp: upstreamProxy.protocol === 'http:',
      headers: {
        'Proxy-Authorization': `Basic ${Buffer.from(upstreamProxy.auth).toString('base64')}`
      }
    };
  }

  // 启动代理服务器
  const server = new ProxyServer(proxyOptions);

  // 捕获并处理代理内部的 ECONNRESET 错误
  process.on('uncaughtException', (err) => {
    if (err.code === 'ECONNRESET') {
      const errorLog = `Connection reset by peer: ${err}\n`;
      logToFile(errorLog); // 写错误日志到文件
      console.warn('A connection was reset by the server:', err);
    } else {
      console.error('An unexpected error occurred:', err);
      logToFile(`Unexpected error: ${err}\n`); // 写其他错误日志
    }
  });

  server.start();
  console.log('AnyProxy server started on port 3001');
}
