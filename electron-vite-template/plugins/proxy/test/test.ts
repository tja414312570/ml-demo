import { createParser, EventSourceParser } from 'eventsource-parser';
import { EventSourceParserStream } from 'eventsource-parser/stream';
import * as eventstreamCodec from '@smithy/eventstream-codec';
import { createHandler } from '../src/share.github'
import path from 'path';
import fs from 'fs';
import  util  from 'util';

// 用来存储最终拼接的消息数据
let fullMessage = "";

const parser = createParser((event) => {
  if (event.type === 'event') {
    // 解析事件数据
    const eventData = JSON.parse(event.data);

    // 检查是否是 "append" 操作，并将内容拼接到最终的消息中
    if (eventData.o === "append" && eventData.v) {
      fullMessage += eventData.v;
    }

    // 处理其他操作类型，比如 "replace" 或 "patch"
    if (eventData.o === "patch") {
      console.log("处理补丁更新: ", eventData.v);
    }
  }
});
const sseData = `
event: delta
data: {"p": "/message/content/parts/0", "o": "append", "v": "你好"}

event: delta
data: {"v": "世界！"}

data: [DONE]
`;
// 模拟完整的 SSE 数据（你可以将其替换为实际的数据源）
const sseData2 = `
data: {"message": {"id": "8b2f0c41-13bc-4214-a8f0-13a6ba356f6c", "author": {"role": "system", "name": null, "metadata": {}}, "create_time": null, "update_time": null, "content": {"content_type": "text", "parts": [""]}, "status": "finished_successfully", "end_turn": true, "weight": 0.0, "metadata": {"is_visually_hidden_from_conversation": true}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                            

data: {"message": {"id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "author": {"role": "user", "name": null, "metadata": {}}, "create_time": 1729008156.142081, "update_time": null, "content": {"content_type": "text", "parts": ["                             \\u73b0\\u5728\\u6211\\u53d1\\u9001\\u8981\\u6c42\\u7ed9\\u4f60\\uff0c\\u4f60\\u53ef\\u4ee5\\u5199python\\u6216bash\\u4ee3\\u7801\\uff0c\\u6211\\u4f1a\\u6267\\u884c\\u4f60\\u7684\\u4ee3\\u7801\\uff0c\\u5e76\\u8fd4\\u56de\\u6267\\u884c\\u7ed3\\u679c\\u4f60\\u3002\\u4f60\\u53ef\\u4ee5\\u89e3\\u6790\\u7ed3\\u679c\\uff0c\\u5e76\\u89e3\\u8bfb\\u7ed9\\u6211\\u3002\\u5bf9\\u4e8epython\\u6216bash\\u7684\\u6267\\u884c\\u7ed3\\u679c\\u4f60\\u53ef\\u4ee5\\u81ea\\u5b9a\\u4e49\\uff0c\\u6bd4\\u5982json\\uff0c\\u5b57\\u7b26\\u4e32\\u7b49\\u3002                             \\u5bf9\\u4e8e\\u67d0\\u4e9b\\u60c5\\u51b5\\uff0c\\u4f60\\u53ef\\u80fd\\u9700\\u8981\\u6211\\u4e0a\\u4f20\\u6587\\u4ef6\\uff0c\\u6b64\\u65f6\\u4f60\\u53ef\\u4ee5\\u5728\\u6253\\u5370\\u4e2d\\u53e6\\u8d77\\u4e00\\u884c\\uff0c\\u4ee5fileupload:[\'file1\',\'file2\']\\u7684\\u683c\\u5f0f\\u8f93\\u51fa\\uff0c\\u6211\\u770b\\u5230\\u4e86\\u4f1a\\u89e3\\u6790\\u91cc\\u9762\\u7684\\u6587\\u4ef6\\uff0c\\u5e76\\u4e00\\u5e76\\u4e0a\\u4f20\\u7ed9\\u4f60\\uff0c\\u5bf9\\u4e8e\\u6587\\u4ef6\\uff0c\\u5efa\\u8bae\\u4f60\\u90fd\\u901a\\u8fc7\\u4e0a\\u4f20\\u6587\\u4ef6\\u7684\\u65b9\\u5f0f\\u5904\\u7406\\u3002                             \\u5bf9\\u4e8e\\u62a5\\u9519\\u6ca1\\u6709\\u76f8\\u5173\\u7ec4\\u4ef6\\u65f6\\uff0c\\u6211\\u6267\\u884c\\u4e86\\u4ee3\\u7801\\u4e4b\\u540e\\uff0c\\u4f1a\\u628a\\u6267\\u884c\\u7ed3\\u679c\\u7ed9\\u4f60\\uff0c\\u4f60\\u53ef\\u4ee5\\u4f9d\\u636e\\u76f8\\u5173\\u7ed3\\u679c\\u7ee7\\u7eed\\u6267\\u884c\\u76f8\\u5173\\u6307\\u4ee4\\u3002                             \\u5bf9\\u4e8e\\u4e00\\u4e9b\\u64cd\\u4f5c\\uff0cbash\\u6267\\u884c\\u66f4\\u597d\\uff0c\\u4f60\\u53ef\\u4ee5\\u5c1d\\u8bd5\\u67e5\\u770b\\u73af\\u5883\\u662f\\u5426\\u652f\\u6301bash\\uff0c\\u5982\\u679c\\u652f\\u6301\\uff0c\\u5219\\u53ef\\u4ee5\\u4f18\\u5148\\u4f7f\\u7528bash\\u547d\\u4ee4\\u3002                             \\u4e3a\\u4e86\\u4f60\\u80fd\\u66f4\\u597d\\u7684\\u9002\\u5e94\\u73af\\u5883\\uff0c\\u5efa\\u8bae\\u4f60\\u7b2c\\u4e00\\u6b65\\u5148\\u83b7\\u53d6\\u73af\\u5883\\uff0c\\u6bd4\\u5982\\u64cd\\u4f5c\\u7cfb\\u7edf\\u3001python\\u73af\\u5883\\u7b49\\u7b49                             \\u6ce8\\u610f\\uff1a1\\u3001\\u6211\\u4e0d\\u4f1a\\u6267\\u884cpython\\u6216bash\\u5916\\u7684\\u5176\\u4ed6\\u64cd\\u4f5c\\uff0c\\u56e0\\u6b64\\u4f60\\u9700\\u8981\\u6211\\u505a\\u7684\\uff0c\\u5747\\u9700\\u8981\\u5199\\u6210python\\u6216bash\\u4ee3\\u7801\\uff0c\\u540c\\u65f6\\u4e00\\u6b21\\u53ea\\u80fd\\u6709\\u4e00\\u4e2apython\\u6216bash\\u4ee3\\u7801\\u5757\\uff0c\\u4e00\\u5b9a\\u8981\\u6ce8\\u610f\\u6253\\u5370\\u4f60\\u9700\\u8981\\u7684\\u4fe1\\u606f\\u3002\\u6211\\u4f1a\\u6267\\u884c\\u540e\\u628a\\u6267\\u884c\\u7ed3\\u679c\\u7ed9\\u4f60\\uff0c\\u4f60\\u9700\\u8981\\u81ea\\u5df1\\u89e3\\u6790\\u4ee5\\u51b3\\u5b9a\\u4e0b\\u4e00\\u6b65\\u64cd\\u4f5c\\u3002python\\u6216bash\\u4ee3\\u7801\\u4e00\\u5b9a\\u8981\\u5b8c\\u6574\\uff0c\\u4e0d\\u8981\\u5199\\u4e0d\\u5b8c\\u6574\\u7684\\u4ee3\\u7801\\u3002                                 2\\u3001\\u9664\\u4e86\\u6211\\u4e3b\\u52a8\\u63d0\\u4f9b\\u7ed9\\u4f60\\u7684\\u73af\\u5883\\uff0c\\u4f60\\u9700\\u8981\\u7684\\u73af\\u5883\\u8d44\\u6599\\u5747\\u53ef\\u4ee5\\u901a\\u8fc7python\\u6216bash\\u4ee3\\u7801\\u6267\\u884c\\u540e\\u6211\\u7ed9\\u4f60\\u3002                                 3\\u3001\\u6240\\u6709\\u64cd\\u4f5c\\u53ea\\u4f7f\\u7528python\\u6216bash\\uff0c\\u5bf9\\u4e8e\\u591a\\u6b65\\u64cd\\u4f5c\\uff0c\\u4f60\\u53ef\\u4ee5\\u5206\\u89e3python\\u6216bash\\u4ee3\\u7801\\u6267\\u884c\\u5faa\\u5e8f\\uff0c\\u6bd4\\u5982\\u6253\\u5f00\\u6d4f\\u89c8\\u5668\\uff0c\\u4f60\\u53ef\\u4ee5\\u7528python\\u6216bash\\u6253\\u5f00\\uff0c\\u5e76\\u5728python\\u6216bash\\u91cc\\u8f93\\u51fa\\u6253\\u5f00\\u7ed3\\u679c\\uff0c\\u7136\\u540e\\u901a\\u8fc7\\u5206\\u6790\\u8fd9\\u4e2a\\u7ed3\\u679c\\u51b3\\u5b9a\\u662f\\u5426\\u622a\\u56fe\\u67e5\\u770b\\u4e0b\\u90e8\\u64cd\\u4f5c\\u7b49\\u3002                                 4\\u3001\\u5343\\u4e07\\u4e0d\\u8981\\u628a\\u6211\\u672c\\u5730\\u73af\\u5883\\u548c\\u4f60\\u7684\\u73af\\u5883\\u5f04\\u6df7\\uff0c\\u7279\\u522b\\u662f\\u4f60\\u5199\\u7684python\\u6216bash\\u4ee3\\u7801\\u7684\\u73af\\u5883\\uff0c\\u6bd4\\u5982\\u8def\\u5f84\\u7b49\\u3002\\u5bf9\\u4e8e\\u8def\\u5f84\\uff0c\\u4f60\\u53ef\\u4ee5\\u81ea\\u5df1\\u67e5\\u770b\\uff0c\\u4e0d\\u8981\\u7528\\u4ec0\\u4e48/path/to/your\\u4e4b\\u7c7b\\u7684\\u5360\\u4f4d\\u7b26\\uff0c\\u4e5f\\u4e0d\\u8981\\u968f\\u610f\\u6df7\\u7528\\u4f60\\u7684\\u73af\\u5883\\u7684mnt/data\\u4e4b\\u7c7b\\u7684\\u3002                                 5\\u3001\\u5bf9\\u4e8e\\u9700\\u8981\\u6211\\u4e0a\\u4f20\\u7684\\u6587\\u4ef6\\uff0c\\u4f60\\u9700\\u8981\\u7528python\\u4ee3\\u7801\\u6267\\u884c\\u4e3afileupload:[\'file1\',\'file2\']\\u7684\\u683c\\u5f0f\\u4e4b\\u540e\\u6211\\u624d\\u80fd\\u8bc6\\u522b\\u3002\\u8bf7\\u6ce8\\u610f\\u683c\\u5f0f\\uff0c\\u4e0d\\u8981\\u968f\\u610f\\u6dfb\\u52a0\\u7a7a\\u683c\\u4e4b\\u7c7b\\u3002                                 6\\u3001\\u7528\\u4e2d\\u6587\\uff0c\\u9664\\u975e\\u5fc5\\u8981\\u7684\\u82f1\\u8bed\\uff0c\\u5176\\u4f59\\u60c5\\u51b5\\u4e0d\\u8981\\u7528\\u9664\\u4e2d\\u6587\\u5916\\u7684\\u5176\\u4ed6\\u8bed\\u8a00                                 "]}, "status": "finished_successfully", "end_turn": null, "weight": 1.0, "metadata": {"serialization_metadata": {"custom_symbol_offsets": []}, "request_id": "8d3108cd0fea81c6-SIN", "message_source": null, "timestamp_": "absolute", "message_type": null}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}             

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": [""]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}    

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                              

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                        

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                  

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}            

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                    

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}              

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}  

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                      

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}          

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                              

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                  

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}      

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                          

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                    

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}              

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}        

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}  

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                      

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}          

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}    

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                        

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}            

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}      

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                          

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199\\u4e00"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                    

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199\\u4e00\\u6bb5"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}              

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199\\u4e00\\u6bb5Python"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}        

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199\\u4e00\\u6bb5Python\\u4ee3\\u7801"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                            

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199\\u4e00\\u6bb5Python\\u4ee3\\u7801\\u6765"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                      

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199\\u4e00\\u6bb5Python\\u4ee3\\u7801\\u6765\\u83b7\\u53d6"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}          

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199\\u4e00\\u6bb5Python\\u4ee3\\u7801\\u6765\\u83b7\\u53d6\\u64cd\\u4f5c"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                              

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199\\u4e00\\u6bb5Python\\u4ee3\\u7801\\u6765\\u83b7\\u53d6\\u64cd\\u4f5c\\u7cfb\\u7edf"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                  

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199\\u4e00\\u6bb5Python\\u4ee3\\u7801\\u6765\\u83b7\\u53d6\\u64cd\\u4f5c\\u7cfb\\u7edf\\u4fe1\\u606f"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}      

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199\\u4e00\\u6bb5Python\\u4ee3\\u7801\\u6765\\u83b7\\u53d6\\u64cd\\u4f5c\\u7cfb\\u7edf\\u4fe1\\u606f\\u548c"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199\\u4e00\\u6bb5Python\\u4ee3\\u7801\\u6765\\u83b7\\u53d6\\u64cd\\u4f5c\\u7cfb\\u7edf\\u4fe1\\u606f\\u548cPython"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                          

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199\\u4e00\\u6bb5Python\\u4ee3\\u7801\\u6765\\u83b7\\u53d6\\u64cd\\u4f5c\\u7cfb\\u7edf\\u4fe1\\u606f\\u548cPython\\u73af\\u5883"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}              

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199\\u4e00\\u6bb5Python\\u4ee3\\u7801\\u6765\\u83b7\\u53d6\\u64cd\\u4f5c\\u7cfb\\u7edf\\u4fe1\\u606f\\u548cPython\\u73af\\u5883\\u4fe1\\u606f"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}  

data: {"message": {"id": "297f4e1b-5198-474b-9db0-436871c69791", "author": {"role": "assistant", "name": null, "metadata": {}}, "create_time": 1729008156.194897, "update_time": null, "content": {"content_type": "text", "parts": ["\\u660e\\u767d\\u4e86\\uff01\\u6211\\u4eec\\u53ef\\u4ee5\\u4ece\\u83b7\\u53d6\\u4f60\\u7684\\u73af\\u5883\\u4fe1\\u606f\\u5f00\\u59cb\\uff0c\\u4ee5\\u4fbf\\u66f4\\u597d\\u5730\\u9002\\u5e94\\u4f60\\u7684\\u7cfb\\u7edf\\u3002\\u9996\\u5148\\uff0c\\u6211\\u5c06\\u7f16\\u5199\\u4e00\\u6bb5Python\\u4ee3\\u7801\\u6765\\u83b7\\u53d6\\u64cd\\u4f5c\\u7cfb\\u7edf\\u4fe1\\u606f\\u548cPython\\u73af\\u5883\\u4fe1\\u606f\\u3002\\n\\n"]}, "status": "in_progress", "end_turn": null, "weight": 1.0, "metadata": {"citations": [], "content_references": [], "gizmo_id": null, "message_type": "next", "model_slug": "gpt-4o-mini", "default_model_slug": "auto", "parent_id": "aaa237c7-ab5c-45ef-b995-3777358006f6", "model_switcher_deny": []}, "recipient": "all", "channel": null}, "conversation_id": "670e921b-cbb0-8002-9abc-a1ba20e84d4a", "error": null}                        

data: [DONE]
`;

// // 解析并处理SSE数据
// parser.feed(sseData);

// // 打印拼接后的完整消息
// console.log("完整的消息: ", fullMessage);

const response = new Response(sseData2)
if (!response.body) {
  throw new Error('No body')
}

// const eventStream = response.body
//   .pipeThrough(new TextDecoderStream())
//   .pipeThrough(new EventSourceParserStream())
//   .getReader()
//   eventStream.read().then(({ done, value }) => {
//     if (!done) {
//       console.log(value); // 处理数据
//     } else {
//       console.log('流读取完成');
//     }
//   })
//  console.log(eventstreamCodec)


// const parser2 = createParser((event) => {
//   // console.log(`获得事件:${JSON.stringify(event)}`)
//   handleServerEvent(event);
// });
// const events = sseData2.split(/\r?\n/)
// for(const event of events){
//   console.log(`处理数据${event}`)
const content = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf-8');
function triggerEvent(event:any) {
  // 假设这里触发 UI 更新或其他业务逻辑
  console.log("Event triggered:", util.inspect(event, { depth: null, colors: true }));
}
createHandler().onMessage(parsedData=>{
  triggerEvent(parsedData);
// //   if ("type" in parsedData) {
// //     switch (parsedData.type) {
// //         case "gizmo_inline_review":
// //             triggerEvent({
// //                 type: "gizmo_inline_review",
// //                 gizmoId: parsedData.gizmo_id
// //             });
// //             break;

// //         case "title_generation":
// //             triggerEvent({
// //                 type: "title_generation",
// //                 title: parsedData.title,
// //                 conversation_id: parsedData.conversation_id
// //             });
// //             break;

// //         case "moderation":
// //             triggerEvent({
// //                 type: "moderation",
// //                 conversationId: parsedData.conversation_id,
// //                 messageId: parsedData.message_id,
// //                 isCompletion: parsedData.is_completion,
// //                 flagged: parsedData.moderation_response.flagged,
// //                 blocked: parsedData.moderation_response.blocked,
// //                 disclaimers: parsedData.moderation_response.disclaimers,
// //                 metadata: parsedData.moderation_response.metadata
// //             });
// //             break;

// //         case "url_moderation":
// //             triggerEvent({
// //                 type: "url_moderation",
// //                 conversationId: parsedData.conversation_id,
// //                 messageId: parsedData.message_id,
// //                 url: parsedData.url_moderation_result.full_url,
// //                 isSafe: parsedData.url_moderation_result.is_safe
// //             });
// //             break;

// //         case "num_variants_in_stream":
// //             triggerEvent({
// //                 type: "num_variants_in_stream",
// //                 num_variants_in_stream: parsedData.num_variants_in_stream,
// //                 display_treatment: parsedData.display_treatment
// //             });
// //             break;

// //         case "conversation_detail_metadata":
// //             triggerEvent(parsedData);
// //             break;
// //     }
// // }
// // // 处理普通消息
// // else {
// //     triggerEvent({
// //         type: "message",
// //         message: parsedData.message,
// //         conversationId: parsedData.conversation_id
// //     });

//     // 结束流的逻辑
//     // 检查是否为助手发送的消息并结束处理
//     // if (isProcessing && parsedData.message.author.role === "assistant" &&
//     //     parsedData.message.content.content_type === "text" &&
//     //     parsedData.message.content.parts[0] !== "") {
//     //     isProcessing = false;
//     //     // messageProcessing.end();
//     // }
// }
}).onEnd(data=>{
    console.log("事件处理完成:",util.inspect(data, { depth: null, colors: true }))
}).handler(content)
// parser2.feed(content)
// }


// const marshaller = new eventstreamCodec.EventStreamMarshaller();
// const encoded = Buffer.from('示例编码数据');
// const event = marshaller.unmarshall(encoded);
// console.log(event);
