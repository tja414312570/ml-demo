import protobuf   from 'google-protobuf';
import protobuf2   from 'protobufjs';
import * as  protobuf3  from '@bufbuild/protobuf';

class Message {
    // 比较当前消息与其他消息是否相等
    equals(otherMessage: Message): boolean {
        return this.getType().runtime.util.equals(this.getType(), this, otherMessage);
    }

    // 克隆当前消息
    clone(): Message {
        return this.getType().runtime.util.clone(this);
    }

    // 从二进制数据中构建消息
    fromBinary(binaryData: Uint8Array, options?: any): this {
        const messageType = this.getType().runtime.bin;
        const readOptions = messageType.makeReadOptions(options);
        messageType.readMessage(this, readOptions.readerFactory(binaryData), binaryData.byteLength, readOptions);
        return this;
    }

    // 从 JSON 数据中构建消息
    fromJson(jsonData: any, options?: any): this {
        const messageType = this.getType();
        const jsonRuntime = messageType.runtime.json;
        const readOptions = jsonRuntime.makeReadOptions(options);
        jsonRuntime.readMessage(messageType, jsonData, readOptions, this);
        return this;
    }

    // 从 JSON 字符串中构建消息
    fromJsonString(jsonString: string, options?: any): this {
        let jsonData: any;
        try {
            jsonData = JSON.parse(jsonString);
        } catch (error) {
            throw new Error(`cannot decode ${this.getType().typeName} from JSON: ${error instanceof Error ? error.message : String(error)}`);
        }
        return this.fromJson(jsonData, options);
    }

    // 将消息序列化为二进制数据
    toBinary(options?: any): Uint8Array {
        const messageType = this.getType().runtime.bin;
        const writeOptions = messageType.makeWriteOptions(options);
        const writer = writeOptions.writerFactory();
        messageType.writeMessage(this, writer, writeOptions);
        return writer.finish();
    }

    // 将消息序列化为 JSON 对象
    toJson(options?: any): any {
        const jsonRuntime = this.getType().runtime.json;
        const writeOptions = jsonRuntime.makeWriteOptions(options);
        return jsonRuntime.writeMessage(this, writeOptions);
    }

    // 将消息序列化为 JSON 字符串
    toJsonString(options?: any): string {
        const prettySpaces = options?.prettySpaces ?? 0;
        return JSON.stringify(this.toJson(options), null, prettySpaces);
    }

    // 将消息序列化为 JSON 对象，使用默认值
    toJSON(): any {
        return this.toJson({ emitDefaultValues: true });
    }

    // 获取当前消息的类型
    getType(): any {
        return Object.getPrototypeOf(this).constructor;
    }
}



/**
 * 定义一个函数 defineProperty，用于将值赋给对象的属性。
 * @param obj - 要赋值的对象
 * @param key - 要设置的属性键
 * @param value - 要赋的值
 * @returns 更新后的对象
 */
function defineProperty<T extends object, K>(obj: T, key: K, value: any): T {
    // 将 key 转换为字符串
    const propertyKey = String(key);

    // 如果 obj 中存在该属性，则定义新属性
    if (propertyKey in obj) {
        Object.defineProperty(obj, propertyKey, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        // 否则，直接赋值
        obj[propertyKey] = value;
    }

    return obj; // 返回更新后的对象
}

class MetaInfo extends Message {
    static fromBinary(binaryData: Uint8Array, options?: any): MetaInfo {
        return new MetaInfo().fromBinary(binaryData, options);
    }

    static fromJson(jsonData: any, options?: any): MetaInfo {
        return new MetaInfo().fromJson(jsonData, options);
    }

    static fromJsonString(jsonString: string, options?: any): MetaInfo {
        return new MetaInfo().fromJsonString(jsonString, options);
    }

    static equals(instance1: MetaInfo, instance2: MetaInfo): boolean {
        return r.proto3.util.equals(MetaInfo, instance1, instance2);
    }

    constructor(initData?: any) {
        super();
        defineProperty(this, "type", 0);
        defineProperty(this, "info", undefined);
        r.proto3.util.initPartial(initData, this);
    }
}

// 定义 MetaInfo 的静态属性
defineProperty(MetaInfo, "runtime", r.proto3);
defineProperty(MetaInfo, "typeName", "msg_pb.MetaInfo");
defineProperty(MetaInfo, "fields", r.proto3.util.newFieldList(() => [
    {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 5 // 假设 5 是对应的类型编号
    },
    {
        no: 2,
        name: "info",
        kind: "scalar",
        T: 9, // 假设 9 是对应的类型编号
        opt: true // 表示可选属性
    }
]));




class PushMessage extends Message {
    static fromBinary(data, options) {
        return new PushMessage().fromBinary(data, options);
    }
    
    static fromJson(json, options) {
        return new PushMessage().fromJson(json, options);
    }
    
    static fromJsonString(jsonString, options) {
        return new PushMessage().fromJsonString(jsonString, options);
    }
    
    static equals(messageA, messageB) {
        return r.proto3.util.equals(PushMessage, messageA, messageB);
    }
    
    constructor(init) {
        super();
        defineProperty(this, "conversationId", { value: void 0 });
        defineProperty(this, "sectionId", { value: void 0 });
        defineProperty(this, "messageId", { value: void 0 });
        defineProperty(this, "localMessageId", { value: void 0 });
        defineProperty(this, "index", { value: void 0 });
        defineProperty(this, "secSender", { value: void 0 });
        defineProperty(this, "replyId", { value: void 0 });
        defineProperty(this, "status", { value: void 0 });
        defineProperty(this, "createTime", { value: void 0 });
        defineProperty(this, "messageType", { value: void 0 });
        defineProperty(this, "contentType", { value: void 0 });
        defineProperty(this, "content", { value: void 0 });
        defineProperty(this, "ttsContent", { value: void 0 });
        defineProperty(this, "ext", { value: {} });
        defineProperty(this, "nextConnectionType", { value: void 0 });
        defineProperty(this, "chunkSeq", { value: void 0 });
        defineProperty(this, "isDelta", { value: void 0 });
        defineProperty(this, "metaInfos", { value: [] });
        defineProperty(this, "localConversationId", { value: void 0 });
        defineProperty(this, "botId", { value: void 0 });
        defineProperty(this, "appletPayload", { value: {} });
        defineProperty(this, "modelType", { value: void 0 });
        defineProperty(this, "updateTime", { value: void 0 });
        defineProperty(this, "threadId", { value: void 0 });
        r.proto3.util.initPartial(init, this);
    }
}

defineProperty(PushMessage, "runtime", { value: r.proto3 });
defineProperty(PushMessage, "typeName", { value: "msg_pb.PushMessage" });
defineProperty(PushMessage, "fields", {
    value: r.proto3.util.newFieldList(() => [{
        no: 1, name: "conversation_id", kind: "scalar", T: 9, opt: true,
    }, {
        no: 2, name: "section_id", kind: "scalar", T: 9, opt: true,
    }, {
        no: 3, name: "message_id", kind: "scalar", T: 9, opt: true,
    }, {
        no: 4, name: "local_message_id", kind: "scalar", T: 9, opt: true,
    }, {
        no: 5, name: "index", kind: "scalar", T: 3, opt: true,
    }, {
        no: 6, name: "sec_sender", kind: "scalar", T: 9, opt: true,
    }, {
        no: 7, name: "reply_id", kind: "scalar", T: 9, opt: true,
    }, {
        no: 8, name: "status", kind: "scalar", T: 5, opt: true,
    }, {
        no: 9, name: "create_time", kind: "scalar", T: 3, opt: true,
    }, {
        no: 10, name: "message_type", kind: "scalar", T: 5, opt: true,
    }, {
        no: 11, name: "content_type", kind: "scalar", T: 5, opt: true,
    }, {
        no: 12, name: "content", kind: "scalar", T: 9, opt: true,
    }, {
        no: 13, name: "tts_content", kind: "scalar", T: 9, opt: true,
    }, {
        no: 14, name: "ext", kind: "map", K: 9, V: { kind: "scalar", T: 9 },
    }, {
        no: 15, name: "next_connection_type", kind: "scalar", T: 5, opt: true,
    }, {
        no: 16, name: "chunk_seq", kind: "scalar", T: 3, opt: true,
    }, {
        no: 17, name: "is_delta", kind: "scalar", T: 8, opt: true,
    }, {
        no: 18, name: "meta_infos", kind: "message", T: a, repeated: true,
    }, {
        no: 19, name: "local_conversation_id", kind: "scalar", T: 9, opt: true,
    }, {
        no: 20, name: "bot_id", kind: "scalar", T: 9, opt: true,
    }, {
        no: 21, name: "applet_payload", kind: "map", K: 9, V: { kind: "scalar", T: 9 },
    }, {
        no: 22, name: "model_type", kind: "scalar", T: 5, opt: true,
    }, {
        no: 23, name: "update_time", kind: "scalar", T: 3, opt: true,
    }, {
        no: 24, name: "thread_id", kind: "scalar", T: 3, opt: true,
    }])
});



class PushCmd extends Message {
    static fromBinary(data, options) {
        return new PushCmd().fromBinary(data, options);
    }
    
    static fromJson(json, options) {
        return new PushCmd().fromJson(json, options);
    }
    
    static fromJsonString(jsonString, options) {
        return new PushCmd().fromJsonString(jsonString, options);
    }
    
    static equals(cmdA, cmdB) {
        return r.proto3.util.equals(PushCmd, cmdA, cmdB);
    }
    
    constructor(init) {
        super();
        defineProperty(this, "cmdType", { value: void 0 });
        defineProperty(this, "index", { value: void 0 });
        defineProperty(this, "conversationId", { value: void 0 });
        defineProperty(this, "messageId", { value: void 0 });
        defineProperty(this, "ext", { value: {} });
        defineProperty(this, "upCmdType", { value: void 0 });
        defineProperty(this, "localMessageId", { value: void 0 });
        r.proto3.util.initPartial(init, this);
    }
}

defineProperty(PushCmd, "runtime", { value: r.proto3 });
defineProperty(PushCmd, "typeName", { value: "msg_pb.PushCmd" });
defineProperty(PushCmd, "fields", {
    value: r.proto3.util.newFieldList(() => [{
        no: 1, name: "cmd_type", kind: "scalar", T: 5, opt: true,
    }, {
        no: 2, name: "index", kind: "scalar", T: 3, opt: true,
    }, {
        no: 3, name: "conversation_id", kind: "scalar", T: 9, opt: true,
    }, {
        no: 4, name: "message_id", kind: "scalar", T: 9, opt: true,
    }, {
        no: 5, name: "ext", kind: "map", K: 9, V: { kind: "scalar", T: 9 },
    }, {
        no: 6, name: "up_cmd_type", kind: "scalar", T: 5, opt: true,
    }, {
        no: 7, name: "local_message_id", kind: "scalar", T: 9, opt: true,
    }])
});

class GeoInfo extends Message {
    static fromBinary(data, options) {
        return new GeoInfo().fromBinary(data, options);
    }
    
    static fromJson(json, options) {
        return new GeoInfo().fromJson(json, options);
    }
    
    static fromJsonString(jsonString, options) {
        return new GeoInfo().fromJsonString(jsonString, options);
    }
    
    static equals(infoA, infoB) {
        return r.proto3.util.equals(GeoInfo, infoA, infoB);
    }
    
    constructor(init) {
        super();
        defineProperty(this, "longitude", { value: void 0 });
        defineProperty(this, "latitude", { value: void 0 });
        defineProperty(this, "countryName", { value: void 0 });
        defineProperty(this, "provinceName", { value: void 0 });
        defineProperty(this, "cityName", { value: void 0 });
        defineProperty(this, "districtName", { value: void 0 });
        defineProperty(this, "townName", { value: void 0 });
        defineProperty(this, "countryCode", { value: void 0 });
        r.proto3.util.initPartial(init, this);
    }
}

defineProperty(GeoInfo, "runtime", { value: r.proto3 });
defineProperty(GeoInfo, "typeName", { value: "msg_pb.GeoInfo" });
defineProperty(GeoInfo, "fields", {
    value: r.proto3.util.newFieldList(() => [{
        no: 1, name: "longitude", kind: "scalar", T: 9, opt: true,
    }, {
        no: 2, name: "latitude", kind: "scalar", T: 9, opt: true,
    }, {
        no: 3, name: "country_name", kind: "scalar", T: 9, opt: true,
    }, {
        no: 4, name: "province_name", kind: "scalar", T: 9, opt: true,
    }, {
        no: 5, name: "city_name", kind: "scalar", T: 9, opt: true,
    }, {
        no: 6, name: "district_name", kind: "scalar", T: 9, opt: true,
    }, {
        no: 7, name: "town_name", kind: "scalar", T: 9, opt: true,
    }, {
        no: 8, name: "country_code", kind: "scalar", T: 9, opt: true,
    }])
});

class AppAction extends Message {
    static fromBinary(data, options) {
        return new AppAction().fromBinary(data, options);
    }
    
    static fromJson(json, options) {
        return new AppAction().fromJson(json, options);
    }
    
    static fromJsonString(jsonString, options) {
        return new AppAction().fromJsonString(jsonString, options);
    }
    
    static equals(actionA, actionB) {
        return r.proto3.util.equals(AppAction, actionA, actionB);
    }
    
    constructor(init) {
        super();
        defineProperty(this, "messageId", { value: void 0 });
        defineProperty(this, "localMessageId", { value: void 0 });
        defineProperty(this, "replyId", { value: void 0 });
        defineProperty(this, "questionId", { value: void 0 });
        defineProperty(this, "createTime", { value: void 0 });
        defineProperty(this, "content", { value: void 0 });
        defineProperty(this, "ext", { value: {} });
        defineProperty(this, "messageType", { value: void 0 });
        r.proto3.util.initPartial(init, this);
    }
}

defineProperty(AppAction, "runtime", { value: r.proto3 });
defineProperty(AppAction, "typeName", { value: "msg_pb.AppAction" });
defineProperty(AppAction, "fields", {
    value: r.proto3.util.newFieldList(() => [{
        no: 1, name: "message_id", kind: "scalar", T: 3, opt: true,
    }, {
        no: 2, name: "local_message_id", kind: "scalar", T: 9, opt: true,
    }, {
        no: 3, name: "reply_id", kind: "scalar", T: 3, opt: true,
    }, {
        no: 4, name: "question_id", kind: "scalar", T: 3, opt: true,
    }, {
        no: 5, name: "create_time", kind: "scalar", T: 3, opt: true,
    }, {
        no: 6, name: "content", kind: "scalar", T: 9, opt: true,
    }, {
        no: 7, name: "ext", kind: "map", K: 9, V: { kind: "scalar", T: 9 },
    }, {
        no: 8, name: "message_type", kind: "scalar", T: 5, opt: true,
    }])
});

class PushEvent extends Message {
    static fromBinary(data, options) {
        return new PushEvent().fromBinary(data, options);
    }
    
    static fromJson(json, options) {
        return new PushEvent().fromJson(json, options);
    }
    
    static fromJsonString(jsonString, options) {
        return new PushEvent().fromJsonString(jsonString, options);
    }
    
    static equals(eventA, eventB) {
        return r.proto3.util.equals(PushEvent, eventA, eventB);
    }
    
    constructor(init) {
        super();
        defineProperty(this, "eventType", { value: 0 });
        defineProperty(this, "message", { value: void 0 });
        defineProperty(this, "cmd", { value: void 0 });
        defineProperty(this, "geo", { value: void 0 });
        defineProperty(this, "appAction", { value: void 0 });
        defineProperty(this, "version", { value: void 0 });
        defineProperty(this, "messageList", { value: [] });
        r.proto3.util.initPartial(init, this);
    }
}

defineProperty(PushEvent, "runtime", { value: r.proto3 });
defineProperty(PushEvent, "typeName", { value: "msg_pb.PushEvent" });
defineProperty(PushEvent, "fields", {
    value: r.proto3.util.newFieldList(() => [{
        no: 1, name: "event_type", kind: "scalar", T: 5,
    }, {
        no: 2, name: "message", kind: "message", T: PushMessage, opt: true,
    }, {
        no: 3, name: "cmd", kind: "message", T: PushCmd, opt: true,
    }, {
        no: 4, name: "geo", kind: "message", T: GeoInfo, opt: true,
    }, {
        no: 5, name: "app_action", kind: "message", T: AppAction, opt: true,
    }, {
        no: 6, name: "version", kind: "scalar", T: 5, opt: true,
    }, {
        no: 7, name: "message_list", kind: "message", T: PushMessage, repeated: true,
    }])
});
