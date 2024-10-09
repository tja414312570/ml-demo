import { IContext } from 'http-mitm-proxy'; // 导入 CommonJS 模块
export interface Bridge {
    onRequest(ctx: IContext): Promise<string|void>
    onResponse(ctx: IContext):  Promise<string|void>
}