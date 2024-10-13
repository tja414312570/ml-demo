import { PluginExtensionContext } from "../../../src/main/plugin/type/plugin";
import { Pluginlifecycle } from "../../../src/main/plugin/type/plugin-lifecycle";

export class AbstractPlugin{
    _init__(ctx:PluginExtensionContext){
        global.pluginContext = ctx;
    }
}