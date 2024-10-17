type EscapeSequence = {
    params: string[];
    command: string;
};

class VirtualWindow {
    private buffer: string[]; // 行缓冲区
    private cursorX: number;
    private cursorY: number;

    constructor() {
        this.buffer = ['']; // 初始化时至少有一行
        this.cursorX = 0;
        this.cursorY = 0;
    }

    clear(): void {
        this.buffer = [''];
        this.cursorX = 0;
        this.cursorY = 0;
    }

    write(text: string): void {
        let remainingText = text;

        while (remainingText) {
            const char = remainingText.charAt(0);
            remainingText = remainingText.slice(1);

            if (char === '\n') {
                this.cursorY++;
                this.cursorX = 0;
                this.ensureLineExists(this.cursorY);
            } else if (char === '\r') {
                this.cursorX = 0; // 回车符重置光标到行首
            } else if (char === '\x1b') {
                const seq = this.parseEscapeSequence(remainingText);
                if (seq) {
                    this.handleEscapeSequence(seq);
                    const seqLength = seq.params.join(';').length + 3;
                    remainingText = remainingText.substring(seqLength);
                }
            } else {
                this.addCharToBuffer(char);
            }
        }
    }

    private addCharToBuffer(char: string): void {
        this.ensureLineExists(this.cursorY);

        if (this.cursorX < this.buffer[this.cursorY].length) {
            // 替换已有字符
            this.buffer[this.cursorY] =
                this.buffer[this.cursorY].substring(0, this.cursorX) +
                char +
                this.buffer[this.cursorY].substring(this.cursorX + 1);
        } else {
            // 光标超出行尾时，追加空格再添加字符
            this.buffer[this.cursorY] = this.buffer[this.cursorY].padEnd(this.cursorX) + char;
        }
        this.cursorX++;
    }

    private parseEscapeSequence(text: string): EscapeSequence | null {
        const match = text.match(/^\x1b\[(.*?)([A-Za-z])/);
        if (match) {
            return { params: match[1].split(';'), command: match[2] };
        }
        return null;
    }

    private handleEscapeSequence(seq: EscapeSequence): void {
        const command = seq.command;
        const [param1, param2] = seq.params.map(p => parseInt(p) || 0);

        switch (command) {
            case 'H': // 光标移动到指定位置 (row, col)
                this.cursorY = param1 - 1;
                this.cursorX = param2 - 1;
                this.ensureLineExists(this.cursorY);
                break;
            case 'A': // 光标上移
                this.cursorY = Math.max(0, this.cursorY - param1);
                break;
            case 'B': // 光标下移
                this.cursorY = Math.min(this.buffer.length - 1, this.cursorY + param1);
                break;
            case 'C': // 光标右移
                this.cursorX = Math.min(this.buffer[this.cursorY].length, this.cursorX + param1);
                break;
            case 'D': // 光标左移
                this.cursorX = Math.max(0, this.cursorX - param1);
                break;
            case 'J': // 清屏
                if (param1 === 2) {
                    this.clear(); // 清除整个屏幕
                }
                break;
            case 'K': // 清除当前行光标后的内容
                this.buffer[this.cursorY] = this.buffer[this.cursorY].substring(0, this.cursorX);
                break;
        }
    }

    private ensureLineExists(lineIndex: number): void {
        while (this.buffer.length <= lineIndex) {
            this.buffer.push('');
        }
    }

    render(): string {
        // 使用换行符连接每一行，并返回完整的文本，包括非光标 ANSI 控制符
        return this.buffer.join('\n');
    }
}

export default VirtualWindow;
