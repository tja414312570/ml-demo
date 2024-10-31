// const decodedMessage = AwesomeMessage.decode(buffer);


class Base64 {
  private base64Chars: string; // Base64 字符集
  private charToValueMap: Uint8Array; // 字符到数值的映射

  constructor() {
      this.base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"; // Base64字符集
      this.charToValueMap = new Uint8Array(256); // 用于映射字符到数值

      // 初始化映射
      for (let index = 0; index < this.base64Chars.length; index++) {
          this.charToValueMap[this.base64Chars.charCodeAt(index)] = index;
      }
  }

  public decode(encoded: string): Uint8Array {
      let outputLength = 3 * encoded.length / 4;
      if (encoded[encoded.length - 2] === "=") outputLength -= 2;
      else if (encoded[encoded.length - 1] === "=") outputLength -= 1;

      const decoded = new Uint8Array(outputLength);
      let resultIndex = 0, state = 0, value, buffer = 0;

      for (let i = 0; i < encoded.length; i++) {
          value = this.charToValueMap[encoded.charCodeAt(i)];
          if (value === undefined) {
              switch (encoded[i]) {
                  case "=":
                      state = 0;
                  case "\n":
                  case "\r":
                  case "\t":
                  case " ":
                      continue;
                  default:
                      throw new Error("Invalid base64 string.");
              }
          }

          switch (state) {
              case 0:
                  buffer = value;
                  state = 1;
                  break;
              case 1:
                  decoded[resultIndex++] = (buffer << 2) | (value >> 4);
                  buffer = value;
                  state = 2;
                  break;
              case 2:
                  decoded[resultIndex++] = (buffer << 4) | (value >> 2);
                  buffer = value;
                  state = 3;
                  break;
              case 3:
                  decoded[resultIndex++] = (buffer << 6) | value;
                  state = 0;
                  break;
          }
      }
      if (state === 1) throw new Error("Invalid base64 string.");
      return decoded.subarray(0, resultIndex);
  }

  public encode(data: Uint8Array): string {
      let encoded = "";
      let state = 0, buffer = 0;

      for (let i = 0; i < data.length; i++) {
          const byte = data[i];
          switch (state) {
              case 0:
                  encoded += this.base64Chars[byte >> 2];
                  buffer = (3 & byte) << 4;
                  state = 1;
                  break;
              case 1:
                  encoded += this.base64Chars[buffer | (byte >> 4)];
                  buffer = (15 & byte) << 2;
                  state = 2;
                  break;
              case 2:
                  encoded += this.base64Chars[buffer | (byte >> 6)];
                  encoded += this.base64Chars[63 & byte];
                  state = 0;
                  break;
          }
      }
      if (state) {
          encoded += this.base64Chars[buffer];
          encoded += "=";
          if (state === 1) encoded += "=";
      }
      return encoded;
  }
}


const message = 'CAES/ggKDzI0NjU4NDIyNTE1MzAyNhIPMjQ2NTg0MjI1MTUzMjgyGg8yNDU0MDQwOTY0MTIxNjIoEzJMTVM0d0xqQUJBQUFBM01zeDkxZGdMR29KVjU0Rko1bThsZDJ0N1NuSjVOUkgwalowWkJ2dHduc0VWU1Q0cXNzejJ0bGFQcC11MGxZRDoPMjQ1NDA0MDk2NDExOTA2QAFIjdqMuQZQAVgBYg57InRleHQiOiLpgqMifWoM5aW95ZGA77yM6YKjchkKFGF1dG9fY3JlYXRlX2NyZWF0aW9uEgEwchkKFGlzX2ZpcnN0X2Fuc3dlcl9pdGVtEgExcgsKBnN0cmVhbRIBMXIVChFlbmFibGVfYm90X21lbW9yeRIAchgKE2Fuc3dlcl93aXRoX3N1Z2dlc3QSATFyEwoMaW5wdXRfdG9rZW5zEgMxMjVyEwoMdWdjX3ZvaWNlX2lkEgMxMDRyGgoNbGxtX2ludGVudGlvbhIJc2VlZF9tYWluchYKEW1lZGlhX3NlYXJjaF90eXBlEgEwciAKGHNlYXJjaF9hY3Rpb25fYmFyX2NvbmZpZxIEbnVsbHISCg1vdXRwdXRfdG9rZW5zEgEwckUKDGlubmVyX2xvZ19pZBI1MDIxNzMwMzU4NTQxMjkwMDAwMDAwMDAwMDAwMDAwMDAwMDBmZmZmMGFjYTJiYTk3OGU0YThyCQoEd2lraRIBMnISCgt0b2tlbl9jb3VudBIDMTI1chQKDmxsbV9tb2RlbF90eXBlEgIzOHKFAQoJYm90X3N0YXRlEnh7ImJvdF9pZCI6IjczMzgyODYyOTk0MTExMDM3ODEiLCJhZ2VudF9uYW1lIjoi6LGG5YyFIiwiYWdlbnRfaWQiOiI3MzM4Mjg2Mjk5NDExMTAzNzgxIiwiYXdhaXRpbmciOiI3MzM4Mjg2Mjk5NDExMTAzNzgxIn1yEwoNbGxtX21lbV9jb3VudBICNDByGwoGc291cmNlEhFzdWdnZXN0ZWRfcHJvbXB0c3IwCgx3cmFwcGVyX25hbWUSIDJmNjEzY2VlMjZiZDRlYTQ5YWNkMTg3NDE1OGRlYzY4chMKBWdyb3VwEgoxNzMwMzU4NTQxcrIBCgpzZWFyY2hfdXJsEqMBaHR0cHM6Ly9zby50b3V0aWFvLmNvbS9zZWFyY2g/a2V5d29yZD0lRTclQkIlOTklRTYlODglOTElRTglQUUlQjIlRTQlQjglQUElRTYlOTUlODUlRTQlQkElOEIlRTUlOTAlQTclRTMlODAlODImcGQ9c3ludGhlc2lzJnRyYWZmaWNfc291cmNlPU9HMTEyNiZvcmlnaW5hbF9zb3VyY2U9MXIXChJzZWFyY2hfZW5naW5lX3R5cGUSATRyFQoQZW5kX3dpdGhfc3VnZ2VzdBIBMXIVCg9tb2RlbF9pZF9BbnN3ZXISAjM4ch8KFGxsbV9pbnRlbnRpb25fZGV0YWlsEgdkZWZhdWx0eAGAAQOIAQGiARM3MzM4Mjg2Mjk5NDExMTAzNzgxMAE=';
const base64 = new Base64();
const m64 = base64.decode(message);
console.log(m64)





class MessageC extends i.Message {
  // 静态方法用于从二进制数据创建消息实例
  static fromBinary(binaryData: Uint8Array, options?: any): MessageC {
      return new MessageC().fromBinary(binaryData, options);
  }

  // 静态方法用于从 JSON 对象创建消息实例
  static fromJson(jsonData: object, options?: any): MessageC {
      return new MessageC().fromJson(jsonData, options);
  }

  // 静态方法用于从 JSON 字符串创建消息实例
  static fromJsonString(jsonString: string, options?: any): MessageC {
      return new MessageC().fromJsonString(jsonString, options);
  }

  // 静态方法用于比较两个消息实例是否相等
  static equals(messageA: MessageC, messageB: MessageC): boolean {
      return r.proto3.util.equals(MessageC, messageA, messageB);
  }

  constructor(initialData?: Partial<MessageC>) {
      super();
      // 使用 s 方法初始化实例属性
      s(this, "eventType", 0); // 事件类型
      s(this, "message", undefined); // 消息内容
      s(this, "cmd", undefined); // 命令
      s(this, "geo", undefined); // 地理信息
      s(this, "appAction", undefined); // 应用行为
      s(this, "version", undefined); // 版本
      s(this, "messageList", []); // 消息列表

      // 初始化部分字段
      r.proto3.util.initPartial(initialData, this);
  }
}
