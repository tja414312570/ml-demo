import { send_ipc_render } from "./send_ipc"
export type CodeContent = {
    code: string,
    language: string
}
export type ExecuteResult = {
    code: string,
    language: string,
    result: string
}
export const previewCode = (code: CodeContent) => {
    send_ipc_render('codeViewApi.code', code)
}

export const executeCodeCompleted = (code: ExecuteResult) => {
    send_ipc_render('codeViewApi.code.executed', code)
}