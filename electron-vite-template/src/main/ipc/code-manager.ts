import { send_ipc_render } from "./send_ipc"
import { v4 as uuidV4 } from 'uuid'
export type InstructContent = {
    code: string,
    language: string,
    executor?: string,
    id: string,
}
export type ExecuteResult = {
    code: string,
    language: string,
    result: string
}
export const wrapperInstruct = (instruction: string, content: string): InstructContent => {
    return { language: instruction, code: content, id: uuidV4() }
}
export const previewCode = (code: Array<InstructContent>) => {
    send_ipc_render('codeViewApi.code', code)
}

export const executeCodeCompleted = (code: ExecuteResult) => {
    send_ipc_render('codeViewApi.code.executed', code)
}