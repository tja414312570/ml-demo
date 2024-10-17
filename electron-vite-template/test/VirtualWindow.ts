type EscapeSequence = {
    params: string[];
    command: string;
};

class VirtualWindow {
    private buffer: string[];
    private cursorX: number;
    private cursorY: number;

    constructor() {
        this.buffer = [''];
        this.cursorX = 0;
        this.cursorY = 0;
    }

    clear(): void {
        this.buffer = [''];
        this.moveToTopLeft();
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
                this.cursorX = 0;
            } else if (char === '\x1b') {
                const seq = this.parseEscapeSequence(remainingText);
                if (seq) {
                    this.handleEscapeSequence(seq);
                    const length = seq.params.join(';').length + 2;
                    remainingText = remainingText.substring(length);
                }
            } else {
                this.ensureLineExists(this.cursorY);
                this.addCharacterAtCursor(char);
                this.cursorX++;
            }
        }

        this.normalizeCursor();
    }

    private parseEscapeSequence(text: string): EscapeSequence | null {
        const match = text.match(/^\[(\d*(?:;\d+)*)?([A-Za-z])/);
        if (match) {
            const params = match[1] ? match[1].split(';') : [];
            return { params, command: match[2] };
        }
        return null;
    }

    private handleEscapeSequence(seq: EscapeSequence): void {
        switch (seq.command) {
            case 'H': // 移动光标到指定位置
            case 'f': // 等同于 'H'
                const row = parseInt(seq.params[0] || '1', 10) - 1;
                const col = parseInt(seq.params[1] || '1', 10) - 1;
                this.cursorY = Math.max(0, Math.min(row, this.buffer.length - 1));
                this.cursorX = Math.max(0, Math.min(col, this.buffer[this.cursorY].length));
                break;

            case 'J': // 清屏
                if (seq.params[0] === '2' || seq.params[0] === '') {
                    this.clear();
                }
                break;

            case 'K': // 清除行到末尾
                if (this.buffer[this.cursorY]) {
                    this.buffer[this.cursorY] = this.buffer[this.cursorY].substring(0, this.cursorX);
                }
                break;

            case 'A': // 上移光标
                const up = parseInt(seq.params[0] || '1', 10);
                this.cursorY = Math.max(0, this.cursorY - up);
                break;

            case 'B': // 下移光标
                const down = parseInt(seq.params[0] || '1', 10);
                this.cursorY = Math.min(this.buffer.length - 1, this.cursorY + down);
                break;

            case 'C': // 右移光标
                const right = parseInt(seq.params[0] || '1', 10);
                this.cursorX = Math.min(this.buffer[this.cursorY].length, this.cursorX + right);
                break;

            case 'D': // 左移光标
                const left = parseInt(seq.params[0] || '1', 10);
                this.cursorX = Math.max(0, this.cursorX - left);
                break;

            default:
                console.warn(`未处理的 ANSI 控制命令: ${seq.command}`);
        }
    }

    private moveToTopLeft(): void {
        this.cursorX = 0;
        this.cursorY = 0;
    }

    private ensureLineExists(lineIndex: number): void {
        while (this.buffer.length <= lineIndex) {
            this.buffer.push('');
        }
    }

    private addCharacterAtCursor(char: string): void {
        if (this.cursorX < this.buffer[this.cursorY].length) {
            this.buffer[this.cursorY] =
                this.buffer[this.cursorY].substring(0, this.cursorX) +
                char +
                this.buffer[this.cursorY].substring(this.cursorX + 1);
        } else {
            this.buffer[this.cursorY] += char;
        }
    }

    private normalizeCursor(): void {
        this.cursorX = Math.max(0, Math.min(this.cursorX, this.buffer[this.cursorY].length));
        this.cursorY = Math.max(0, Math.min(this.cursorY, this.buffer.length - 1));
    }

    render(): string {
        return this.buffer.join('\n');
    }
}

export default VirtualWindow;
