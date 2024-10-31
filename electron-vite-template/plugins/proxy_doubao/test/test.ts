import path from "path";
import fs from "fs";
import { protoBase64 } from "./proto-base64";
import { PushEvent, PushMessage } from "./message";
console.log(protoBase64);
const message = fs.readFileSync(path.join(__dirname, "test.txt"), "utf-8");
//npx protoc --ts_out . --proto_path . message.proto

//message.ext.is_finish

const splits = message.split(/\r?\n/);
let i = 0;
for (const line of splits) {
  if (i % 4 === 2) {
    const m64 = protoBase64.dec(line.substring(5));
    const msg = PushEvent.fromBinary(m64);
    console.log("================================");
    console.log(msg);
  }
  i++;
}
