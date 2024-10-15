import { IContext } from 'http-mitm-proxy'; // 导入 CommonJS 模块
export interface Bridge {
    onRequest(ctx: IContext): Promise<string | void>
    onResponse(ctx: IContext): Promise<string | void>
}

export const  enum InstructResultType{
    executing="executing",
    completed="completed",
    failed="failed"
}
export type InstructResult = {
    id:string,
    std?:string,
    ret?:string,
    type:InstructResultType
}
export interface InstructExecutor {
    execute(instruct: InstructContent): Promise<InstructResult | void>
}

export type InstructContent = {
    id:string,
    code: string,
    language: string
}
export type ExecuteResult = {
    code: string,
    language: string,
    result: string
}