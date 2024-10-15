// import executor from '../src/index'
// const instruct = {
//     id:'xxx',
//     code: `
//       console.log("Hello, World!");
//       throw new Error("Hello, World!");
//       resolve({"ttt": "Execution completed successfully."})
//     `,
//     language: 'javascript'
//   };
//   executor.execute(instruct)
//     .then(output => console.log(output))
//     .catch(error => console.error(error));
const { createParser } = require('eventsource-parser');

// 创建解析器
const parser = createParser((event) => {
  if (event.type === 'event') {
    console.log('接收到事件:');
    console.log('ID:', event.id || '无');
    console.log('事件名称:', event.name || '无');
    console.log('数据:', event.data);
  }
});

// 模拟完整的 SSE 数据（你可以将其替换为实际的数据源）
const sseData = `
event: delta_encoding
data: "v1"

event: delta
data: {"p": "", "o": "add", "v": {"message": {"id": "494bba74-cd3f-482f-8ec2-b16838de77bd", "author": {"role": "assistant"}, "content": {"content_type": "text", "parts": [""]}}}}

event: delta
data: {"p": "/message/content/parts/0", "o": "append", "v": "你好"}

data: [DONE]
`;

// 将数据逐块传递给解析器
parser.feed(sseData);
