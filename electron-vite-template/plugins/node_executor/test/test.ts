import executor from '../src/index'
const instruct = {
    id:'xxx',
    code: `
      console.log("Hello, World!");
      throw new Error("Hello, World!");
      resolve({"ttt": "Execution completed successfully."})
    `,
    language: 'javascript'
  };
  executor.execute(instruct)
    .then(output => console.log(output))
    .catch(error => console.error(error));
  