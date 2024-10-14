import { PluginExtensionContext } from "../../../src/main/plugin/type/plugin";

export class AbstractPlugin{
    _init__(ctx:PluginExtensionContext){
        pluginContext = ctx;
    }
}