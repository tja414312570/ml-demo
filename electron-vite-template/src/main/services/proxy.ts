import { IContext, IProxyOptions, Proxy } from 'http-mitm-proxy'; // 导入 CommonJS 模块
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import zlib from 'zlib';
import { processResponse } from './dispatcher'

import { info } from '../utils/logger'

export async function startProxyServer(upstreamProxy) {
  const proxy = new Proxy(); // 使用 http-mitm-proxy 创建代理实例

  // 拦截 HTTP 请求
  proxy.onRequest((ctx, callback) => {
    // console.log("请求", ctx.proxyToServerRequestOptions.host)
    const requestData = ctx.clientToProxyRequest;
    let body = [];

    // requestData.on('data', (chunk) => {
    //   body.push(chunk);
    // }).on('end', () => {
    //   body = Buffer.concat(body).toString();
    //   const logData = `Request intercepted: ${requestData.url}\nRequest Body: ${body}\n`;
    //   logToFile(logData);
    // });
    callback(); // 继续请求
  });

  const processResponseBody = (ctx: IContext) => {
    return new Promise((resolve, reject) => {
      // 如果响应是压缩的，进行解压
      const response = ctx.serverToProxyResponse;
      const requestOptions = ctx.proxyToServerRequestOptions;

      // 获取响应的 Content-Type 和 Content-Encoding
      const contentType = response.headers['content-type'] || '';
      const contentEncoding = response.headers['content-encoding'] || '';

      // 检查是否是压缩响应
      const isCompressed = contentEncoding.includes('gzip') || contentEncoding.includes('deflate') || contentEncoding.includes('br');

      let body: any = [];

      response.on('data', (chunk) => {
        body.push(chunk);
      });

      response.on('end', () => {
        body = Buffer.concat(body);

        // 如果响应是压缩的，进行解压
        if (isCompressed) {
          if (contentEncoding.includes('gzip')) {
            zlib.gunzip(body, (err, decompressedBody) => {
              if (!err) {
                resolve(decompressedBody.toString());
              } else {
                console.error('Gzip 解压失败:', err);
                reject(err);
              }
            });
          } else if (contentEncoding.includes('deflate')) {
            zlib.inflate(body, (err, decompressedBody) => {
              if (!err) {
                resolve(decompressedBody.toString());
              } else {
                console.error('Deflate 解压失败:', err);
                reject(err);
              }
            });
          } else if (contentEncoding.includes('br')) {
            zlib.brotliDecompress(body, (err, decompressedBody) => {
              if (!err) {
                resolve(decompressedBody.toString());
              } else {
                console.error('Brotli 解压失败:', err);
                reject(err);
              }
            });
          }
        } else {
          // 如果没有压缩，直接返回响应体
          resolve(body.toString());
        }
      });

      response.on('error', (err) => {
        reject(err);
      });
    });
  }
  // 拦截 HTTP 响应
  proxy.onResponse((ctx, callback) => {
    const response = ctx.serverToProxyResponse;
    const requestOptions = ctx.proxyToServerRequestOptions;

    // 获取响应的 Content-Type
    const contentType = response.headers['content-type'] || '';

    // 检查是否是静态资源，如 HTML、CSS、图片等
    const isStaticResource = (
      contentType.includes('html') ||      // HTML 页面
      contentType.includes('css') ||       // CSS 样式表
      contentType.includes('image') ||         // 图片（如 png, jpg, gif 等）
      contentType.includes('javascript') ||  // JS 文件
      contentType.includes('font')             // 字体文件
    );

    if (isStaticResource) {
      // const cspHeader = ctx.serverToProxyResponse.headers['content-security-policy'];
      // if (contentType.includes('html') && cspHeader) {
      //     delete ctx.serverToProxyResponse.headers['content-security-policy'];
      //     console.log('Content-Security-Policy header removed.');
      // }
      // console.log("静态资源请求，放行", requestOptions.host);
    } else {
      // 非静态资源（例如 JSON 或 API 响应），可能是 fetch 请求
      console.log("拦截处理:" + requestOptions.host + "" + requestOptions.path + "，上下文类型:" + contentType);
      let logData = `拦截处理:${requestOptions.method}:${requestOptions.port === 443 ? 'https' : 'http'}://${requestOptions.host}${requestOptions.path}\n`;
      let promise = processResponseBody(ctx);
      promise.then(bodyStr => {
        processResponse(ctx, bodyStr);
        logData += `响应数据: ${bodyStr}\n`;
      }).catch(err => {
        logData += `错误原因: ${err}\n`;
        console.error(err);
      }).finally(() => {
        info(logData);
      })
    }

    callback(); // 继续响应
  });

  // 处理 ECONNRESET 错误
  process.on('uncaughtException', (err: any) => {
    if (err.code === 'ECONNRESET') {
      const errorLog = `Connection reset by peer: ${err}\n`;
      info(errorLog); // 写错误日志到文件
      console.warn('A connection was reset by the server:', err);
    } else {
      console.error('An unexpected error occurred:', err);
      info(`Unexpected error: ${err}\n`); // 写其他错误日志
    }
  });
  // proxy.onCertificateMissing = (ctx, files, callback) => {
  //   console.log('Looking for "%s" certificates', ctx.hostname);
  //   console.log('"%s" missing', ctx.files.keyFile);
  //   console.log('"%s" missing', ctx.files.certFile);

  //   // Here you have the last chance to provide certificate files data
  //   // A tipical use case would be creating them on the fly
  //   //
  //   return callback(null, {
  //     key: keyFileData,
  //     cert: certFileData
  //   });
  // };

  proxy.onError((ctx, err) => {
    console.error('Proxy error:', err);
  });

  let options: IProxyOptions = { port: 3001, host: '127.0.0.1' };
  // 判断是否需要使用上游代理
  if (upstreamProxy) {
    const proxyUrl = `${upstreamProxy.protocol}//${upstreamProxy.host}:${upstreamProxy.port}`;
    info(`使用上游代理:${proxyUrl}`)
    options.httpAgent = new HttpProxyAgent(proxyUrl);
    options.httpsAgent = new HttpsProxyAgent(proxyUrl);
  }
  (proxy as any)._onError_bak_ = proxy._onError;
  proxy._onError = (kind, ctx, err) => {
    if ((err as any).code === 'ERR_SSL_SSLV3_ALERT_CERTIFICATE_UNKNOWN') {
      // console.log(`忽略 SSL 错误: ${ctx.clientToProxyRequest.url}`);
      return;
    }
    (proxy as any)._onError_bak_(kind, ctx, err)
  }
  // 启动代理服务器

  return new Promise((resolve, reject) => {
    proxy.listen(options, (err) => {
      if (err) {
        reject(err)
      } else {
        console.log('http-mitm-proxy server started on port 3001');
        resolve(proxy);
      }
    });
  });
}
