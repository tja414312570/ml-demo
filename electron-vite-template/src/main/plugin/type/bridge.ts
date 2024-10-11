import { IContext } from 'http-mitm-proxy'; // 导入 CommonJS 模块
export interface Bridge {
    onRequest(ctx: IContext): Promise<string | void>
    onResponse(ctx: IContext): Promise<string | void>
}

export interface InstructExecutor {
    execute(instruct: InstructContent): Promise<string | void>
}

export type InstructContent = {
    code: string,
    language: string
}
export type ExecuteResult = {
    code: string,
    language: string,
    result: string
}