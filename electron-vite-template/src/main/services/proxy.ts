import { IProxyOptions, Proxy } from 'http-mitm-proxy'; // 导入 CommonJS 模块
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

import { info } from '../utils/logger'
import pluginManager from '@main/plugin/plugin-manager';
import { PluginType } from '@main/plugin/type/plugin';
import { Bridge } from '@main/plugin/type/bridge';
import { notifyError } from '@main/ipc/notify-manager';

export async function startProxyServer(upstreamProxy) {
  const proxy = new Proxy(); // 使用 http-mitm-proxy 创建代理实例

  // 拦截 HTTP 请求
  proxy.onRequest((ctx, callback) => {
    pluginManager.resolvePluginModule<Bridge>(PluginType.agent)
      .then(module => {
        module.onRequest(ctx);
        callback(); // 继续请求
      }).catch(err => {
        console.error(err);
        notifyError(`处理请求出现错误:${String(err)}`)
        callback(err)
      })
  });

  // 拦截 HTTP 响应
  proxy.onResponse((ctx, callback) => {
    pluginManager.resolvePluginModule<Bridge>(PluginType.agent)
      .then(module => {
        module.onResponse(ctx).then((body: string) => {
          if (body) {
            console.log("解析出数据：" + body)
          }
        });
        callback(); // 继续请求
      }).catch(err => {
        console.error("处理响应异常", err);
        notifyError(`处理请求出现错误:${String(err)}`)
        callback(err)
      })
  })


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
