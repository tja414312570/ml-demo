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
        <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
                <v-icon small v-bind="props" @click="executeCode" color="blue">{{ isExecuting ? 'mdi-close' :
                    'mdi-play-outline' }}</v-icon>
            </template>
            <span>{{ isExecuting ? '停止执行' : '停止所有代码执行' }}</span>
        </v-tooltip>
        <v-progress-circular v-show='isExecuting' color="purple" :width="3" indeterminate
            size="16"></v-progress-circular>
        <!-- 已 Debug 执行图标带提示 -->
        <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
                <v-icon small v-bind="props" @click="handleDebugExecute" color="orange">mdi-bug-play-outline</v-icon>
            </template>
            <span>调试模式执行代码</span>
        </v-tooltip>
        <div>{{ language }}</div>
        <div> <v-select :items="executors" item-title="name" v-model="selected" item-value="id" density="compact"
                label="Compact" single-line></v-select>
        </div>
        <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
                <v-icon small v-bind="props" @click="toggleAutoSend" :color="isAutoSend ? 'green' : 'grey'">{{
                    isAutoSend ?
                        'mdi-send-check-outline' : 'mdi-send-lock-outline' }}</v-icon>
            </template>
            <span>{{ isAutoSend ? '自动发送执行结果' : '手动发送执行结果' }}</span>
        </v-tooltip>
        <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
                <v-icon small v-bind="props" @click="closeAll"
                    :color="runing > 0 ? 'green' : 'grey'">mdi-close-circle-multiple-outline</v-icon>
            </template>
            <span>{{ runing > 0 ? '关闭所有任务' : '没有运行中的任务' }}</span>
        </v-tooltip>

    </div>
</template>

<script lang="ts" setup>
import { InstructContent } from '@main/ipc/code-manager';
import { InstructResultType } from '@lib/main';
import { PluginInfo } from '@lib/main';
import { IpcEventHandler } from '@renderer/ts/default-ipc';
import { getIpcApi } from '@lib/preload';
import { onMounted, ref, watch } from 'vue';
import * as monaco from 'monaco-editor';

const executors = ref<PluginInfo[]>([])

const selected = ref<string>(null)
const isAutoSend = ref(true)

const isExecuting = ref(false);
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

const props = defineProps<InstructContent & { editor: monaco.editor.IStandaloneCodeEditor }>();
watch(
    () => props.editor,
    (newValue) => {
        console.log('user 对象发生变化:', newValue);
        newValue.onKeyDown(function (event) {
            isAutoRunEnabled.value = false;
        });
    },
    { deep: true } // 深度监听对象
);
const runing = ref(0);
const refreshPluginStatus = (id: string) => {
    pluginViewApi.invoke('get-plugin-tasks', { id }).then(tasks => {
        runing.value = tasks.length
    })
}
refreshPluginStatus(selected.value);
watch(selected, (newValue) => {
    console.log("获取插件的任务:", newValue)
    refreshPluginStatus(newValue);
})
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
const closeAll = () => {
    pluginViewApi.invoke('get-plugin-tasks', { id: selected.value }).then(tasks => {
        const promises = tasks.map(id =>
            codeApi.invoke("execute.stop", { id, executor: selected.value } as InstructContent)
        );

        // 使用 Promise.all 等待所有 Promise 执行完成
        Promise.all(promises)
            .then(results => {
                refreshPluginStatus(selected.value);
                // 在此处执行下一步操作
            })
            .catch(error => {
                alert("任务执行错误")
            });
    })
};
const toggleAutoSend = () => {
    isAutoSend.value = !isAutoSend.value;
};
let result = [];
codeApi.on('insertLine', (event: any, lineDiff: { code: string, line: number, type: InstructResultType }) => {
    refreshPluginStatus(selected.value);
    const { code, line, type } = lineDiff;
    try {
        result.push(code)
        if (type !== InstructResultType.executing) {
            isExecuting.value = false;
            if (isAutoSend.value) {
                codeApi.send('send_execute-result', result.join('\r\n'))
                result = [];
            }

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
    if (isExecuting.value) {
        codeApi.invoke("execute.stop", { id: props.id, executor: selected.value } as InstructContent).then(result => {

        }).catch(err => {
            console.log('代码停止执行错误:', err)
        })
        return;
    }
    isExecuting.value = true;
    codeApi.executeCode({ code: props.code, id: props.id, language: props.language, executor: selected.value } as InstructContent).then(result => {
        console.log('代码已执行:', props.code)
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