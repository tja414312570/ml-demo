process.on("message", async (message) => {
  const { code, execId } = message;
  // 直接执行用户代码，不使用 vm 模块
  // 使用 new Function 运行传递的代码
  await eval(`(async () => { ${code} })()`);
  // 退出子进程
  process.send(execId);
  process.exit(0);
});
