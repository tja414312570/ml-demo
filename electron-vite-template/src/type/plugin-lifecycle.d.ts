/**
 * 插件生命周期
 */
export interface Pluginlifecycle {
    /**
     * 挂载之前
     */
    onBeforeMounted(): void
    /**
     * 当挂载插件时
     */
    onMounted(): void
    /**
     * 卸载之前
     */
    onBeforeMounted(): void
    /**
     * 当卸载插件时 
     */
    onUnmounted(): void
}