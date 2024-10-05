import express from 'express';
import fetch from 'node-fetch';

import {HttpsProxyAgent} from 'https-proxy-agent';

// 设置上游代理 URL
const proxyUrl = 'http://127.0.0.1:7890';  // 替换为你的代理地址
const agent = new HttpsProxyAgent(proxyUrl);

const app = express();

app.get('/', async (req, res) => {
  const targetUrl = req.query.url;
  if (targetUrl) {
    try {
      const response = await fetch(targetUrl,{ agent });
      if (response.ok) {
        response.body.pipe(res);  // 将响应流传输给客户端
      } else {
        res.status(response.status).send('请求失败');
      }
    } catch (error) {
      console.error('请求失败:', error.message);
      res.status(500).send('请求失败');
    }
  } else {
    res.status(400).send('Missing URL parameter');
  }
});
export function startProxy (){
    app.listen(3000, () => {
        console.log('代理服务器运行在 http://localhost:3000');
      });
      
}
