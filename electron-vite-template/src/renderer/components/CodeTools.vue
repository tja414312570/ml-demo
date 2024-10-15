<template>
    <div class="action-bar">
        <v-tooltip location="bottom">
            <!-- 自动执行图标（Auto Run / Disable Auto Run）带提示 -->
            <template v-slot:activator="{ props }">
                <v-icon v-bind="props" small @click="toggleAutoExecute" :color="isAutoRunEnabled ? 'green' : 'grey'">
                    {{ isAutoRunEnabled ? 'mdi-refresh-auto' : 'mdi-pause' }}
                </v-icon>
            </template>
            <span>{{ isAutoRunEnabled ? '自动执行已启用' : '自动执行已禁用' }}</span>
        </v-tooltip>
        <!-- 执行图标带提示 -->
        <v-tooltip bottom>
            <template v-slot:activator="{ props }">
                <v-icon small v-bind="props" @click="executeCode" color="blue">mdi-play-outline</v-icon>
            </template>
            <span>执行代码</span>
        </v-tooltip>

        <!-- 已 Debug 执行图标带提示 -->
        <v-tooltip bottom>
            <template v-slot:activator="{ props }">
                <v-icon small v-bind="props" @click="handleDebugExecute" color="orange">mdi-bug-play-outline</v-icon>
            </template>
            <span>调试模式执行代码</span>
        </v-tooltip>
        <div>{{ language }}</div>
        <div> <v-select :items="executors" item-title="name" v-model="selected" item-value="id" density="compact"
                label="Compact" single-line></v-select>
        </div>
        <v-tooltip bottom>
            <template v-slot:activator="{ props }">
                <v-icon small v-bind="props" @click="toggleAutoSend" :color="isAutoSend ? 'green' : 'grey'">{{
                    isAutoSend ?
                        'mdi-send-check-outline' : 'mdi-send-lock-outline' }}</v-icon>
            </template>
            <span>{{ isAutoSend ? '自动发送执行结果' : '手动发送执行结果' }}</span>
        </v-tooltip>
    </div>
</template>

<script lang="ts" setup>
import { InstructContent } from '@main/ipc/code-manager';
import { PluginInfo } from '@main/plugin/type/plugin';
import { IpcEventHandler } from '@renderer/ts/default-ipc';
import { getIpcApi } from '@renderer/ts/ipc-api';
import { onMounted, ref, watch } from 'vue';

const executors = ref<PluginInfo[]>([])

const selected = ref<string>(null)
const isAutoSend = ref(true)

const pluginViewApi: any = getIpcApi('plugin-view-api');
const codeApi = getIpcApi<IpcEventHandler>('code-view-api');
const loading = ref(true);

onMounted(() => {
    pluginViewApi.invoke('get-plugin-list', { type: 'executor' }).then((pluginList: Array<PluginInfo>) => {
        console.log("获取到插件列表", pluginList)
        executors.value = pluginList.sort((a, b) => {
            const aMatchesLanguage = a.instruct?.includes(props.language) ? 1 : 0;
            const bMatchesLanguage = b.instruct?.includes(props.language) ? 1 : 0;
            console.log(aMatchesLanguage, bMatchesLanguage)
            // 优先匹配到 language 的排前面
            return bMatchesLanguage - aMatchesLanguage;
        });
        selected.value = executors.value[0]['id']
        loading.value = false
    }).catch(err => {
        console.error("获取到插件失败", err)
    })
})

const props = defineProps<InstructContent>();
// 监听对象变化
watch(
    () => props.code,
    (newValue) => {
        console.log('user 对象发生变化:', newValue);
        executors.value = executors.value.sort((a, b) => {
            const aMatchesLanguage = a.instruct?.includes(props.language) ? 1 : 0;
            const bMatchesLanguage = b.instruct?.includes(props.language) ? 1 : 0;
            console.log(aMatchesLanguage, bMatchesLanguage)
            // 优先匹配到 language 的排前面
            return bMatchesLanguage - aMatchesLanguage;
        });
        selected.value = executors.value[0]['id']
        if (isAutoRunEnabled.value) {
            executeCode()
        }
    },
    { deep: true } // 深度监听对象
);
const isAutoRunEnabled = ref(true);

// 切换自动执行状态
const toggleAutoExecute = () => {
    isAutoRunEnabled.value = !isAutoRunEnabled.value;
    if (isAutoRunEnabled.value) {
        executeCode(); // 自动执行
    }
};
const toggleAutoSend = () => {
    isAutoSend.value = !isAutoSend.value;
};
codeApi.on('codeViewApi.insertLine', (event: any, lineDiff: { code: string, line: number }) => {
    const { code, line } = lineDiff;
    console.log("执行完毕", JSON.stringify(lineDiff))
    try {
        if (isAutoSend.value) {
            codeApi.send('send_execute-result', code)
        }
    } catch (error) {
        console.error(`执行出错:`, error);
        // 你可以在这里添加自定义的错误处理，例如发送通知或日志记录
    }
}
)

// Debug 执行代码的逻辑
const handleDebugExecute = () => {
    debugExecuteCode();
};

// 模拟的代码执行函数
const executeCode = () => {
    codeApi.executeCode({ code: props.code, id: props.id, language: props.language, executor: selected.value } as InstructContent).then(result => {
        console.log('代码已执行:', props.code)
        console.log('代码执行结果:', result)
    }).catch(err => {
        console.log('代码执行错误:', err)
    })
        ;
};

// 模拟的已 Debug 执行函数
const debugExecuteCode = () => {
    console.log('代码已以 Debug 模式执行');
};
</script>

<style scoped>
.action-bar {
    /* position: absolute; */
    /* top: 20px; */
    /* left: 50%; */
    /* transform: translateX(-50%); */
    display: flex;
    align-items: center;
    padding: 10px 20px;
    gap: 15px;
    z-index: 100;
    /* border-radius: 12px; */
    /* 毛玻璃悬浮效果 */
    background: rgb(18, 17, 17);
    /* 半透明背景 */
    /* backdrop-filter: blur(10px); */
    /* 毛玻璃效果 */
    /* box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); */
    /* 阴影效果 */
}

:deep(.v-field__input) {
    padding: 2px 0px 2px 2px;
    min-height: 0;
}

:deep(.v-list-item--density-default.v-list-item--one-line) {
    min-height: auto;
}

:deep(.v-list-item--density-default) {
    min-height: auto;
}

:deep(.v-field--appended) {
    padding-inline-end: 0;
}

:deep(.v-text-field .v-input__details) {
    display: none;
}

:deep(.v-select__menu-icon) {
    margin-inline-start: 0;
}

.content {
    margin-top: 60px;
    /* 留出给固定的操作栏的空间 */
    padding: 20px;
}

.v-icon {
    cursor: pointer;
}
</style>