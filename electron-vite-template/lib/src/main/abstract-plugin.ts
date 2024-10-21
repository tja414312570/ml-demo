import { PluginExtensionContext } from "./plugin";

export class AbstractPlugin {
    _init__(ctx: PluginExtensionContext) {
        pluginContext = ctx;
    }
}