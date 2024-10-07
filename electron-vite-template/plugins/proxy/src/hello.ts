import { Bridge } from "../../../src/type/bridge";

export function sayHello(name: string): void {
    console.log(`Hello, ${name}!`);
  }
  
class Test implements Bridge{
  onResponse(body: any): void {
    throw new Error("Method not implemented.");
  }
}