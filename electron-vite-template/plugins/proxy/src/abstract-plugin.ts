import { PluginExtensionContext } from "../../../src/main/plugin/type/plugin";

let ctx:PluginExtensionContext = {} as PluginExtensionContext;
export class AbstractPlugin{
    _init__(ctx:PluginExtensionContext){
        ctx = ctx;
    }
}
export const notify = ()=>ctx.notifyManager.notify;