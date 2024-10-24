import { InstructResultType } from "mylib/main";
import executor from "../src/main/index";
console.log(InstructResultType.executing); // 这里可能报错

const instruct = {
  id: "xxx",
  code: `
      alert("h")
    `,
  language: "javascript",
};
executor
  .execute(instruct)
  .then((output) => console.log(output))
  .catch((error) => console.error(error));
