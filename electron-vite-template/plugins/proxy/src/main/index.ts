import { Bridge ,PluginExtensionContext,AbstractPlugin} from 'mylib/main'
import { Pluginlifecycle } from 'mylib/main'
import { IContext } from 'http-mitm-proxy';
import { decompressedBody } from './decode';
import { processResponse } from './dispatcher';
import path from 'path';

class ChatGptBridge extends AbstractPlugin implements Bridge, Pluginlifecycle {
  requireJs(): Promise<string | void> {
    return new Promise(resolve=>{
      resolve(path.join("file://", path.join(__dirname,"assets","js_bridge.js")))
    })
  }
  onRequest(ctx: IContext): Promise<string | void> {
    // console.log("请求", ctx.proxyToServerRequestOptions.host)
    return new Promise<string | void>((resolve, rejects) => {
      const requestData = ctx.clientToProxyRequest;
      
      let body: Uint8Array[] = [];
      requestData.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', () => {
        const requestBody = Buffer.concat(body).toString();
        // const logData = `请求拦截: ${requestData.url}\nRequest Body: ${body}\n`;
        // console.log(logData);
        resolve(requestBody);
      });

    })
  }
  onResponse(ctx: IContext): Promise<string | void> {
    return new Promise<string | void>(async (resolve) => {
      const response = ctx.serverToProxyResponse;

      // 获取响应的 Content-Type
      const contentType = response?.headers['content-type'] || '';

      // 检查是否是静态资源，如 HTML、CSS、图片等
      const isStaticResource = (
        contentType.includes('html') ||      // HTML 页面
        contentType.includes('css') ||       // CSS 样式表
        contentType.includes('image') ||         // 图片（如 png, jpg, gif 等）
        contentType.includes('javascript') ||  // JS 文件
        contentType.includes('font')             // 字体文件
      );

      if (isStaticResource) {
        ctx.proxyToClientResponse.setHeader('Cache-Control', 'max-age=21600');
        // 如果有需要，还可以修改 Expires 头
        const expiresDate = new Date(Date.now() + 21600 * 1000).toUTCString();
        ctx.proxyToClientResponse.setHeader('Expires', expiresDate);
        resolve();
        return;
      }
      // 非静态资源（例如 JSON 或 API 响应），可能是 fetch 请求
      // console.log("拦截处理:" + requestOptions.host + "" + requestOptions.path + "，上下文类型:" + contentType);
      // let logData = `拦截处理:${requestOptions?.method}:${requestOptions?.port === 443 ? 'https' : 'http'}://${requestOptions?.host}${requestOptions?.path}\n`;
      const decodeResult = await decompressedBody(ctx);
      // logData += `响应数据: ${decodeResult}\n`;
      // console.log(logData);
      const sseData = processResponse(response?.headers, decodeResult);
      resolve(sseData)
    })
  }
  onMounted(ctx: PluginExtensionContext): void {
    console.log("proxy代理已挂载")
  }
  onUnmounted(ctx: PluginExtensionContext): void {
  }

}
export default new ChatGptBridge();
