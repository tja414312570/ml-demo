import { createServer } from 'http';
import https from 'https'; // 用于解密 HTTPS 流量
import fs from 'fs'; // 用于加载证书
import net from 'net'; // 用于处理 TLS 隧道
import proxyModule from 'http-proxy';
import url from 'url';

const { createProxyServer } = proxyModule;

// 加载自签名证书 (生成自签名证书步骤见下文)
const privateKey = fs.readFileSync('myCA.key', 'utf8');
const certificate = fs.readFileSync('myCA.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

export const startProxyServer = (upstreamProxy) => {
  const proxy = createProxyServer({});

  // 创建 HTTPS 服务器，用于处理 HTTPS 流量的解密
  const httpsServer = https.createServer(credentials, (req, res) => {
    console.log('----- New HTTPS Request -----');
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    console.log('Request Headers:', JSON.stringify(req.headers, null, 2));

    // 将请求转发到上游代理或目标服务器
    proxy.web(req, res, {
      target: `https://${req.headers.host}`, // 直接代理 HTTPS 请求
      changeOrigin: true
    }, (err) => {
      console.error('Proxy error:', err);
      res.writeHead(502);
      res.end('Proxy error: ' + err.message);
    });
  });

  // 创建 HTTP 代理服务器
  const httpServer = createServer((req, res) => {
    console.log('----- New HTTP Request -----');
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    console.log('Request Headers:', JSON.stringify(req.headers, null, 2));

    // 将 HTTP 请求转发到目标服务器
    proxy.web(req, res, {
      target: `${upstreamProxy.protocol}//${upstreamProxy.host}:${upstreamProxy.port}`,
      headers: {
        'Proxy-Authorization': 'Basic ' + Buffer.from(upstreamProxy.auth || '').toString('base64')
      }
    }, (err) => {
      console.error('Proxy error:', err);
      res.writeHead(502);
      res.end('Proxy error: ' + err.message);
    });
  });

  // 处理 HTTPS 请求的 CONNECT 方法
  httpServer.on('connect', (req, clientSocket, head) => {
    console.log('Handling HTTPS CONNECT method for:', req.url);

    const { port, hostname } = url.parse(`http://${req.url}`);

    // 代理 HTTPS 连接
    const serverSocket = net.connect(port || 443, hostname, () => {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                         'Proxy-agent: Node.js-Proxy\r\n' +
                         '\r\n');
      serverSocket.write(head);
      serverSocket.pipe(clientSocket);
      clientSocket.pipe(serverSocket);
    });

    serverSocket.on('error', (err) => {
      console.error('Error in HTTPS connection:', err);
      clientSocket.end();
    });
  });

  // 监听代理响应，处理 XHR 和 event-stream 响应
  proxy.on('proxyRes', (proxyRes, req, res) => {
    let body = '';

    proxyRes.on('data', (chunk) => {
      body += chunk;
    });

    proxyRes.on('end', () => {
      console.log('Response Headers:', proxyRes.headers);

      // 检查是否是 XHR 请求
      if (req.headers['x-requested-with'] && req.headers['x-requested-with'] === 'XMLHttpRequest') {
        console.log('XHR Response Body:', body);
      }

      // 检查是否是 event-stream
      if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/event-stream')) {
        console.log('Event-Stream Response Body:', body);
      }

      // 打印完整的响应体
      console.log('Full Response Body:', body);

      // 继续将响应发送回客户端
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      res.end(body);
    });
  });

  proxy.on('error', (err, req, res) => {
    console.error('Proxy encountered an error:', err);
    res.writeHead(502, {
      'Content-Type': 'text/plain'
    });
    res.end('Something went wrong. Error: ' + err.message);
  });

  httpServer.listen(3000, () => {
    console.log('HTTP Proxy server running on port 3000');
  });

  httpsServer.listen(3001, () => {
    console.log('HTTPS Proxy server running on port 3001');
  });
};
