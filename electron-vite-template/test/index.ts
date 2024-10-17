class AnsiStateManager {
    constructor() {
        this.state = [];
    }

    // 添加新的 ANSI 输出
    addOutput(output) {
        // 将新的输出解析为行并处理状态
        const lines = output.split('\n');
        lines.forEach(line => {
            this.processLine(line);
        });
    }

    // 处理每一行，更新状态
    processLine(line) {
        // 去掉 ANSI 转义字符
        line = line.replace(/\x1b\[[0-9;]*m/g, '');

        // 如果是回车符，则更新最后一行
        if (line.includes('\r')) {
            const lastLineIndex = this.state.length - 1;
            this.state[lastLineIndex] = line;
        } else {
            // 否则将新行添加到状态
            this.state.push(line);
        }
    }

    // 获取最终合并的状态
    getFinalOutput() {
        return this.state.join('\n');
    }
}

// 使用示例
const ansiManager = new AnsiStateManager();

// 模拟增量输出
const outputs = [
    'hello world',
    '\x1b[32mTask 1: 20% [==========>                                       ]\r',
    '\x1b[32mTask 2: 40% [==================>                               ]\r',
    '\x1b[32mTask 1: 80% [=========================>                        ]\r',
    '\x1b[33mAll tasks completed!\n'
];

// 添加输出并获取最终状态
outputs.forEach(output => {
    ansiManager.addOutput(output)
    console.log(ansiManager.getFinalOutput());
});
