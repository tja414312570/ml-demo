<template>
    <div>
        <!-- 插件列表 -->
        <v-list>
            <v-list-item v-for="plugin in plugins" :key="plugin.id" class="plugin-item">
                <v-list-item-content>
                    <v-list-item-title>{{ plugin.manifest.name }}</v-list-item-title>
                    <v-list-item-subtitle>版本: {{ plugin.manifest.version }} | 作者: {{ plugin.manifest.author
                        }}</v-list-item-subtitle>
                </v-list-item-content>
                <!-- 插件类型和操作按钮区域 -->
                <v-list-item-action class="action-buttons">
                    <!-- 显示插件类型 -->
                    <v-chip class="plugin-type" small>{{ plugin.manifest.pluginType }}</v-chip>
                    <div style="flex:1" class="action-group">
                        <!-- 查看详情按钮 -->
                        <v-tooltip bottom>
                            <template v-slot:activator="{ props }">
                                <v-btn density="compact" icon="mdi-information-outline" small v-bind="props"
                                    @click="showDetails(plugin)">
                                </v-btn>
                            </template>
                            <span>查看详情</span>
                        </v-tooltip>

                        <!-- 禁用启用切换 -->
                        <v-tooltip bottom>
                            <template v-slot:activator="{ props }">
                                <v-btn density="compact"
                                    :icon="plugin.enabled ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off'" small
                                    v-bind="props" @click="togglePlugin(plugin)">
                                </v-btn>
                            </template>
                            <span>{{ plugin.enabled ? '禁用' : '启用' }}</span>
                        </v-tooltip>

                        <!-- 卸载按钮 -->
                        <v-tooltip bottom>
                            <template v-slot:activator="{ props }">
                                <v-btn density="compact" icon="mdi-delete-outline" small v-bind="props"
                                    @click="unloadPlugin(plugin)">
                                </v-btn>
                            </template>
                            <span>卸载插件</span>
                        </v-tooltip>
                    </div>
                </v-list-item-action>
            </v-list-item>
        </v-list>

        <!-- 插件详情对话框 -->
        <v-dialog v-model="dialog" max-width="600px">
            <v-card>
                <v-card-title>
                    <span class="headline">{{ selectedPlugin?.manifest.name }} 详细信息</span>
                </v-card-title>
                <v-card-text>
                    <v-list dense>
                        <v-list-item>
                            <v-list-item-content>版本: {{ selectedPlugin?.manifest.version }}</v-list-item-content>
                        </v-list-item>
                        <v-list-item>
                            <v-list-item-content>作者: {{ selectedPlugin?.manifest.author }}</v-list-item-content>
                        </v-list-item>
                        <v-list-item>
                            <v-list-item-content>许可证: {{ selectedPlugin?.manifest.license || '无许可证'
                                }}</v-list-item-content>
                        </v-list-item>
                        <v-list-item>
                            <v-list-item-content>类型: {{ selectedPlugin?.manifest.pluginType }}</v-list-item-content>
                        </v-list-item>
                        <v-list-item>
                            <v-list-item-content>支持钩子:
                                <v-chip v-for="hook in selectedPlugin?.manifest.supportedHooks" :key="hook">{{ hook
                                    }}</v-chip>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item>
                            <v-list-item-content>适用域名:
                                <v-chip v-for="domain in selectedPlugin?.manifest.match" :key="domain">{{ domain
                                    }}</v-chip>
                            </v-list-item-content>
                        </v-list-item>
                    </v-list>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="dialog = false">关闭</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';


import { getIpcApi } from '@renderer/ts/ipc-api';

const pluginViewApi: any = getIpcApi('plugin-view-api');
onMounted(() => {
    pluginViewApi.invoke('get-plugin-list').then(pluginList => {
        console.log("获取到插件列表", pluginList)
    }).catch(err => {
        console.error("获取到插件失败", err)
    })
})

interface PluginManifest {
    name: string;
    version: string;
    description: string;
    main: string;
    pluginType: string;
    supportedHooks: string[];
    author: string;
    license?: string;
    type: string;
    match?: string[];
}

interface PluginInfo {
    id: string;
    manifest: PluginManifest;
    enabled: boolean;
}

const dialog = ref(false);
const selectedPlugin = ref<PluginInfo | null>(null);

const plugins = ref<PluginInfo[]>([
    {
        id: '1',
        manifest: {
            name: 'SamplePlugin',
            version: '1.0.0',
            description: 'A sample plugin for demonstrating packaging with TypeScript.',
            main: './dist/bundle.js',
            pluginType: 'custom',
            supportedHooks: ['sampleHook'],
            author: 'Your Name',
            license: 'MIT',
            type: 'bridge',
            match: ['https://chat.openai.com/*', 'https://chatgpt.com/*', 'https://share.github.cn.com/*']
        },
        enabled: true
    }
]);

// 方法：切换插件启用/禁用状态
const togglePlugin = (plugin: PluginInfo) => {
    plugin.enabled = !plugin.enabled;
    console.log(`${plugin.manifest.name} 已切换到 ${plugin.enabled ? '启用' : '禁用'}`);
};

// 方法：卸载插件
const unloadPlugin = (plugin: PluginInfo) => {
    console.log(`${plugin.manifest.name} 已卸载`);
    // 此处可以触发插件卸载逻辑
};

// 方法：显示详情对话框
const showDetails = (plugin: PluginInfo) => {
    selectedPlugin.value = plugin;
    dialog.value = true;
};
</script>

<style scoped>
.headline {
    font-size: 1.5rem;
    font-weight: bold;
}

.v-icon {
    font-size: 23px;
    /* 设置图标大小为23px */
}

.v-btn {
    /* 按钮最小宽度 */
    padding: 0 !important;
    /* 缩小按钮的内边距 */
}

.action-buttons {
    display: flex;
    justify-content: flex-end;
    /* 将按钮对齐到最右边 */
    align-items: center;
    /* 确保内容垂直居中 */
}

.plugin-type {
    margin-right: 8px;
    /* 插件类型和操作按钮之间的间距 */
}

.action-group {
    flex: 1 1 0%;
    justify-content: end;
    display: flex;
}
</style>
