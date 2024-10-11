import { PluginExtensionContext } from "../../../src/main/plugin/type/plugin";

// global.d.ts
declare global {
   var pluginContext: PluginExtensionContext;
   var notifyManager:{notify:(message:string)=>void,notifyError:(message:string)=>void}
}

export {};
