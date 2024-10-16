import { applyPatch, Operation } from 'fast-json-patch';
const fieldMap = [["channel", "c"], ["path", "p"], ["op", "o"], ["value", "v"]];
import {produce} from "immer"

import util from 'util'

const StreamEncoding = {
    V1:'v1',
    V1_TEST:'v1_test'
}
type Delta = {
    channel: number,
    op: string,
    path: string,
    value: any,
    [key: string]: any; // 允许其他任意属性，比如 __root
};
class DeltaProcessor {
    prevObjByChannel: any[];
    prevDelta: { channel: number; op: string; path: string; value: undefined; };
    constructor() {
        this.prevObjByChannel = [];
        this.prevDelta = {
            channel: 0,
            op: "add",
            path: "",
            value: undefined
        };
    }

    // 应用增量到对象上
    applyDelta(delta:Delta) {
        try {
            const decodedDelta = this.decodeDelta(delta);
            const channelId = decodedDelta.channel;
            const previousObj = this.prevObjByChannel[channelId];
            const updatedObj = mergeDeltas2(previousObj, decodedDelta);
            this.prevObjByChannel[channelId] = updatedObj;
            return updatedObj;
        } catch (error) {
            logError(`Error applying delta: ${error}`,error);
        }
    }

    // 解码增量
    decodeDelta(delta:Delta) {
        validateDelta(delta);
        const newDelta = mergeDeltas(delta, this.prevDelta);
        const result = expandDelta(newDelta);
        this.prevDelta = result;
        return result;
    }

    // 将增量应用到对象
    applyDeltaToObject(targetObject:Delta, delta:Delta) {
        return traverseObject({
            __root: targetObject
        }, (root:any) => applyOperation(root, delta)).__root;
    }
}
// 辅助函数：解析路径
function parsePath(path:string) {
    const pathArray:any[] = ["__root"];
    if (path === "") return pathArray;
    if (path[0] === "/") path = path.substring(1);
    
    for (const part of path.split("/")) {
        const isIndex = /^(?:0|[1-9]\d*)$/d.test(part);
        pathArray.push(isIndex ? parseInt(part, 10) : decodePath(part));
    }
    
    return pathArray;
}

// 辅助函数：处理路径中的转义字符
function decodePath(part:string) {
    return part.replace(/~1/g, "/").replace(/~0/g, "~");
}
function mergeDeltas2(target: any, delta: any): any {
    return produce({ __root: target },r=>applyOperation(r, delta)).__root;
}

// 将增量应用到对象的方法
function applyOperation(obj:any, delta:Delta) {
    const pathArray = parsePath(delta.path ?? "");
    for (let i = 0; i < pathArray.length - 1; i++) {
        if (obj[pathArray[i]] === void 0) {
            obj[pathArray[i]] = typeof pathArray[i + 1] === "number" ? [] : {};
        }
        obj = obj[pathArray[i]];
    }

    const lastKey = pathArray[pathArray.length - 1];
    
    switch (delta.op) {
        case "patch":
            for (const subDelta of delta.value) {
                const temp = { __root: obj[lastKey] };
                applyOperation(temp, subDelta);
                obj[lastKey] = temp.__root;
            }
            break;
        case "add":
            Array.isArray(obj) ? obj.splice(lastKey, 0, delta.value) : obj[lastKey] = delta.value;
            break;
        case "remove":
            Array.isArray(obj) ? obj.splice(lastKey, 1) : delete obj[lastKey];
            break;
        case "replace":
            obj[lastKey] = delta.value;
            break;
        case "append":
            if (typeof obj[lastKey] === "string") {
                obj[lastKey] += delta.value;
            } else if (Array.isArray(obj[lastKey])) {
                obj[lastKey].push(...expandArray(delta.value));
            } else {
                obj[lastKey] = delta.value;
            }
            break;
        case "truncate":
            if (typeof obj[lastKey] === "string") {
                obj[lastKey] = obj[lastKey].substring(0, delta.value);
            } else if (Array.isArray(obj[lastKey])) {
                obj[lastKey].length = delta.value;
            }
            break;
        default:
            throw new Error("Unknown json delta operation");
    }
}
// 合并当前增量和之前的增量数据
function mergeDeltas(currentDelta:Delta, previousDelta:Delta) {
    for (const [fullField, shortField] of fieldMap) {
        if (fullField !== "value" && !(shortField in currentDelta)) {
            currentDelta[shortField] = previousDelta[fullField];
        }
    }
    return currentDelta;
}

// 将简化字段转换为完整字段，并处理增量中的嵌套
function expandDelta(delta:Delta) {
    const expanded = { ...delta };
    for (const [fullField, shortField] of fieldMap) {
        if (shortField in delta) {
            expanded[fullField] = delta[shortField];
            delete delta[shortField];
        }
    }
    // 递归处理 patch 操作
    if (expanded.op === "patch") {
        expanded.value = expanded.value.map(expandDelta);
    }
    return expanded;
}

// 验证增量数据格式
function validateDelta(delta:Delta) {
    if (!delta || typeof delta !== "object") {
        throw new Error("Unexpected delta non-object");
    }
}
// 辅助函数：遍历对象并应用函数
function traverseObject(obj:any, callback:(arg:any)=>void):any {
    return callback(obj);
}

// 辅助函数：将值扩展为数组
function expandArray(value:Delta) {
    return Array.isArray(value) ? value : [value];
}

// 辅助函数：记录错误
function logError(...args:any) {
    console.error(args);
}

// 判断是否为对象
function isObject(obj:any) {
    return obj && typeof obj === 'object' && !Array.isArray(obj);
}
function triggerEvent(event:any) {
    // 假设这里触发 UI 更新或其他业务逻辑
    console.log("Event triggered:", util.inspect(event, { depth: null, colors: true }));
}

let isProcessing = false;

let currentEncoding = '';

let isConsistent = true;
let deltaProcessor:DeltaProcessor|null = null;
let  previousObject;
export function handleServerEvent(event:any) {
    // 将接收到的数据传递给流追踪器
    console.log('处理:',event.data);

    // 如果事件流已结束（收到 "[DONE]"）
    if (event.data === "[DONE]") {
        // 中止当前的操作并结束流
        triggerEvent({
            type: "done"
        });
        // cleanUp();
        return;
    }

    // 如果事件类型不是 "ping"，则处理其他事件
    if (event.event !== "ping") {
        try {
            // 尝试将事件数据解析为 JSON
            let parsedData = JSON.parse(event.data);

            // 处理 "delta_encoding" 事件
            if (event.event === "delta_encoding") {
                if (parsedData === StreamEncoding.V1 || parsedData === StreamEncoding.V1_TEST) {
                    currentEncoding = parsedData; // 保存当前的编码
                    // turnTracker.stream_encoding = currentEncoding ?? void 0; // 追踪流的编码
                    deltaProcessor = new DeltaProcessor(); // 初始化增量处理器
                } else {
                    logError(`[completion-delta] 未知的增量编码: ${parsedData}`);
                    return;
                }
            } 
            // 处理 "delta" 事件
            else if (event.event === "delta") {
                if (!deltaProcessor) { // 检查是否有增量处理器
                    logError("[completion-delta] delta 事件在 delta_encoding 之前触发");
                    return;
                }

                // 将增量应用到对象上
                const updatedObject = deltaProcessor.applyDelta(parsedData);

                // 如果是测试编码类型，进行一致性检查
                if (currentEncoding === StreamEncoding.V1_TEST) {
                    // if (!isConsistent && !compareObjects(updatedObject, previousObject)) {
                    //     isConsistent = true;
                    //     logError("[completion-delta] 增量导致对象不一致", {
                    //         differences: getDifferences(updatedObject, previousObject)
                    //     });
                    // }
                    return;
                } else {
                    parsedData = updatedObject;
                }
            } 
            // 保存当前对象以进行一致性检查
            else if (currentEncoding === StreamEncoding.V1_TEST && !isConsistent) {
                  previousObject = parsedData;
            }

            // 如果收到的是错误消息，触发错误事件
            if (parsedData.error) {
                const error = createErrorMessage("server", parsedData.error);
                throw triggerEvent({
                    type: "error",
                    error: error
                }), error;
            }

            // 处理不同类型的事件
            if ("type" in parsedData) {
                switch (parsedData.type) {
                    case "gizmo_inline_review":
                        triggerEvent({
                            type: "gizmo_inline_review",
                            gizmoId: parsedData.gizmo_id
                        });
                        break;

                    case "title_generation":
                        triggerEvent({
                            type: "title_generation",
                            title: parsedData.title,
                            conversation_id: parsedData.conversation_id
                        });
                        break;

                    case "moderation":
                        triggerEvent({
                            type: "moderation",
                            conversationId: parsedData.conversation_id,
                            messageId: parsedData.message_id,
                            isCompletion: parsedData.is_completion,
                            flagged: parsedData.moderation_response.flagged,
                            blocked: parsedData.moderation_response.blocked,
                            disclaimers: parsedData.moderation_response.disclaimers,
                            metadata: parsedData.moderation_response.metadata
                        });
                        break;

                    case "url_moderation":
                        triggerEvent({
                            type: "url_moderation",
                            conversationId: parsedData.conversation_id,
                            messageId: parsedData.message_id,
                            url: parsedData.url_moderation_result.full_url,
                            isSafe: parsedData.url_moderation_result.is_safe
                        });
                        break;

                    case "num_variants_in_stream":
                        triggerEvent({
                            type: "num_variants_in_stream",
                            num_variants_in_stream: parsedData.num_variants_in_stream,
                            display_treatment: parsedData.display_treatment
                        });
                        break;

                    case "conversation_detail_metadata":
                        triggerEvent(parsedData);
                        break;
                }
            } 
            // 处理普通消息
            else {
                triggerEvent({
                    type: "message",
                    message: parsedData.message,
                    conversationId: parsedData.conversation_id
                });

                // 结束流的逻辑

                // 检查是否为助手发送的消息并结束处理
                if (isProcessing && parsedData.message.author.role === "assistant" && 
                    parsedData.message.content.content_type === "text" && 
                    parsedData.message.content.parts[0] !== "") {
                    isProcessing = false;
                    // messageProcessing.end();
                }
            }
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
        }
    }
}

class CustomError extends Error{

}
function createErrorMessage(arg0: string, error: any) {
    throw new Error("Function not implemented.");
}

