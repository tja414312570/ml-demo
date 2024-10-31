// const decodedMessage = AwesomeMessage.decode(buffer);
// import { PushMessage } from "./message_pb";
import path from "path";
import fs from "fs";
import { protoBase64 } from "./proto-base64";
import { PushEvent, PushMessage } from "./message";
console.log(protoBase64);
const message = fs.readFileSync(path.join(__dirname, "test.txt"), "utf-8");
//"CAES/ggKDzI0NjU4NDIyNTE1MzAyNhIPMjQ2NTg0MjI1MTUzMjgyGg8yNDU0MDQwOTY0MTIxNjIoEzJMTVM0d0xqQUJBQUFBM01zeDkxZGdMR29KVjU0Rko1bThsZDJ0N1NuSjVOUkgwalowWkJ2dHduc0VWU1Q0cXNzejJ0bGFQcC11MGxZRDoPMjQ1NDA0MDk2NDExOTA2QAFIjdqMuQZQAVgBYg57InRleHQiOiLpgqMifWoM5aW95ZGA77yM6YKjchkKFGF1dG9fY3JlYXRlX2NyZWF0aW9uEgEwchkKFGlzX2ZpcnN0X2Fuc3dlcl9pdGVtEgExcgsKBnN0cmVhbRIBMXIVChFlbmFibGVfYm90X21lbW9yeRIAchgKE2Fuc3dlcl93aXRoX3N1Z2dlc3QSATFyEwoMaW5wdXRfdG9rZW5zEgMxMjVyEwoMdWdjX3ZvaWNlX2lkEgMxMDRyGgoNbGxtX2ludGVudGlvbhIJc2VlZF9tYWluchYKEW1lZGlhX3NlYXJjaF90eXBlEgEwciAKGHNlYXJjaF9hY3Rpb25fYmFyX2NvbmZpZxIEbnVsbHISCg1vdXRwdXRfdG9rZW5zEgEwckUKDGlubmVyX2xvZ19pZBI1MDIxNzMwMzU4NTQxMjkwMDAwMDAwMDAwMDAwMDAwMDAwMDBmZmZmMGFjYTJiYTk3OGU0YThyCQoEd2lraRIBMnISCgt0b2tlbl9jb3VudBIDMTI1chQKDmxsbV9tb2RlbF90eXBlEgIzOHKFAQoJYm90X3N0YXRlEnh7ImJvdF9pZCI6IjczMzgyODYyOTk0MTExMDM3ODEiLCJhZ2VudF9uYW1lIjoi6LGG5YyFIiwiYWdlbnRfaWQiOiI3MzM4Mjg2Mjk5NDExMTAzNzgxIiwiYXdhaXRpbmciOiI3MzM4Mjg2Mjk5NDExMTAzNzgxIn1yEwoNbGxtX21lbV9jb3VudBICNDByGwoGc291cmNlEhFzdWdnZXN0ZWRfcHJvbXB0c3IwCgx3cmFwcGVyX25hbWUSIDJmNjEzY2VlMjZiZDRlYTQ5YWNkMTg3NDE1OGRlYzY4chMKBWdyb3VwEgoxNzMwMzU4NTQxcrIBCgpzZWFyY2hfdXJsEqMBaHR0cHM6Ly9zby50b3V0aWFvLmNvbS9zZWFyY2g/a2V5d29yZD0lRTclQkIlOTklRTYlODglOTElRTglQUUlQjIlRTQlQjglQUElRTYlOTUlODUlRTQlQkElOEIlRTUlOTAlQTclRTMlODAlODImcGQ9c3ludGhlc2lzJnRyYWZmaWNfc291cmNlPU9HMTEyNiZvcmlnaW5hbF9zb3VyY2U9MXIXChJzZWFyY2hfZW5naW5lX3R5cGUSATRyFQoQZW5kX3dpdGhfc3VnZ2VzdBIBMXIVCg9tb2RlbF9pZF9BbnN3ZXISAjM4ch8KFGxsbV9pbnRlbnRpb25fZGV0YWlsEgdkZWZhdWx0eAGAAQOIAQGiARM3MzM4Mjg2Mjk5NDExMTAzNzgxMAE=";
// const base64 = new Base64();
// let m64 = base64.decode(message);

// const file = path.join(__dirname, "message.proto");
// const proto = schema.parse(fs.readFileSync(file));
// const pbf = new Pbf(new Uint8Array(m64));

const m64 = protoBase64.dec(message);
const msg = PushEvent.fromBinary(m64);
console.log(msg);
// pbf.readFields((tag) => {
//   console.log("===========tag");
//   pbf.read
//   console.log(tag);
// }, {});
// console.log(proto);
// protobuf2.load(path.join(__dirname, "message.proto"), function (err, root) {
//   if (err) throw err;

//   // Obtain a message type
//   var AwesomeMessage = root.lookupType("PushMessage");

//   // // Exemplary payload
//   // var payload = { awesomeField: "AwesomeString" };

//   // // Verify the payload if necessary (i.e. when possibly incomplete or invalid)
//   // var errMsg = AwesomeMessage.verify(payload);
//   // if (errMsg) throw Error(errMsg);

//   // // Create a new message
//   // var message = AwesomeMessage.create(payload); // or use .fromObject if conversion is necessary

//   // // Encode a message to an Uint8Array (browser) or Buffer (node)
//   // var buffer = AwesomeMessage.encode(message).finish();
//   // // ... do something with buffer
//   const reader = new protobuf2.BufferReader(m64);
//   // Decode an Uint8Array (browser) or Buffer (node) to a message
//   var message = AwesomeMessage.decode(reader);
//   // ... do something with message

//   // If the application uses length-delimited buffers, there is also encodeDelimited and decodeDelimited.

//   // Maybe convert the message back to a plain object
//   var object = AwesomeMessage.toObject(message, {
//     longs: String,
//     enums: String,
//     bytes: String,
//     // see ConversionOptions
//   });
// });
