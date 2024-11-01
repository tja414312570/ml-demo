import { IProxyOptions, Proxy } from 'http-mitm-proxy'; // 导入 CommonJS 模块
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

import { info } from '../utils/logger'
import pluginManager from '@main/plugin/plugin-manager';
import { PluginType } from '@lib/main';
import { Bridge } from '@lib/main';
import { notifyError } from '@main/ipc/notify-manager';
import { dispatch } from './dispatcher';
function isUrlMatched(url, patterns) {
  return patterns.some(pattern => {
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/([.+?^${}()|[\]\\])/g, '\\$1');
    const regex = new RegExp('^' + regexPattern + '$');
    return regex.test(url);
  });
}

// 使用函数检查

export async function startProxyServer() {
  const proxy = new Proxy(); // 使用 http-mitm-proxy 创建代理实例

  // 拦截 HTTP 请求
  proxy.onRequest((ctx, callback) => {
    const requestPath = ctx.clientToProxyRequest.url; // 获取请求路径
    const host = ctx.clientToProxyRequest.headers.host; // 获取主机名

    // 根据请求的协议构建完整的 URL
    const protocol = ctx.isSSL ? 'https' : 'http';
    const requestUrl = `${protocol}://${host}${requestPath}`;
    console.log("服务器请求", ctx)
    pluginManager.resolvePluginModule<Bridge>(PluginType.agent, (pluginsOfType => {
      for (const plugin of pluginsOfType) {
        const isMatch = isUrlMatched(requestUrl, plugin.match);
        if (isMatch) {
          return plugin;
        }
      }
      return null;
    }))
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
    const requestPath = ctx.clientToProxyRequest.url; // 获取请求路径
    const host = ctx.clientToProxyRequest.headers.host; // 获取主机名

    // 根据请求的协议构建完整的 URL
    const protocol = ctx.isSSL ? 'https' : 'http';
    const requestUrl = `${protocol}://${host}${requestPath}`;
    console.log("服务器响应", ctx.serverToProxyResponse.headers)
    pluginManager.resolvePluginModule<Bridge>(PluginType.agent, (pluginsOfType => {
      for (const plugin of pluginsOfType) {
        const isMatch = isUrlMatched(requestUrl, plugin.match);
        if (isMatch) {
          return plugin;
        }
      }
      return null;
    }))
      .then(module => {
        module.onResponse(ctx).then((body: string) => {
          if (body) {
            console.log("解析出数据：" + body)
            dispatch(ctx.serverToProxyResponse.headers, body);
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
  // if (upstreamProxy) {
  //   const proxyUrl = `${upstreamProxy.protocol}//${upstreamProxy.host}:${upstreamProxy.port}`;
  //   info(`使用上游代理:${proxyUrl}`)
  //   options.httpAgent = new HttpProxyAgent(proxyUrl);
  //   options.httpsAgent = new HttpsProxyAgent(proxyUrl);
  // }
  // (proxy as any)._onError_bak_ = proxy._onError;
  // proxy._onError = (kind, ctx, err) => {
  //   if ((err as any).code === 'ERR_SSL_SSLV3_ALERT_CERTIFICATE_UNKNOWN') {
  //     // console.log(`忽略 SSL 错误: ${ctx.clientToProxyRequest.url}`);
  //     return;
  //   }
  //   (proxy as any)._onError_bak_(kind, ctx, err)
  // }
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
