<template>
    <div class="action-bar">
        <v-tooltip location="bottom">
            <!-- 自动执行图标（Auto Run / Disable Auto Run）带提示 -->
            <template v-slot:activator="{ props }">
                <v-icon v-bind="props" small @click="toggleAutoExecute" :color="isAutoRunEnabled ? 'green' : 'grey'">
                    {{ isAutoRunEnabled ? 'mdi-autorenew' : 'mdi-close-circle-outline' }}
                </v-icon>
            </template>
            <span>{{ isAutoRunEnabled ? '自动执行已启用' : '自动执行已禁用' }}</span>
        </v-tooltip>
        <!-- 执行图标带提示 -->
        <v-tooltip bottom>
            <template v-slot:activator="{ props }">
                <v-icon small v-bind="props" @click="handleExecute" color="blue">mdi-play-circle</v-icon>
            </template>
            <span>执行代码</span>
        </v-tooltip>

        <!-- 已 Debug 执行图标带提示 -->
        <v-tooltip bottom>
            <template v-slot:activator="{ props }">
                <v-icon small v-bind="props" @click="handleDebugExecute" color="orange">mdi-bug</v-icon>
            </template>
            <span>调试模式执行代码</span>
        </v-tooltip>
        <div>{{ language }}</div>
        <div> <v-select :items="executors" v-model="selected" density="compact" label="Compact" single-line></v-select>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

const executors = ref<string[]>(['ssh 执行器'])

const selected = ref(executors.value[0])



const props = defineProps<{
    code: string,
    language: string
}>();
// 监听对象变化
watch(
    () => props.code,
    (newValue) => {
        console.log('user 对象发生变化:', newValue);
    },
    { deep: true } // 深度监听对象
);
const isAutoRunEnabled = ref(false);

// 切换自动执行状态
const toggleAutoExecute = () => {
    isAutoRunEnabled.value = !isAutoRunEnabled.value;
    if (isAutoRunEnabled.value) {
        executeCode(); // 自动执行
    }
};

// 执行代码的逻辑
const handleExecute = () => {
    executeCode();
};

// Debug 执行代码的逻辑
const handleDebugExecute = () => {
    debugExecuteCode();
};

// 模拟的代码执行函数
const executeCode = () => {
    window.codeViewApi.executeCode({ code: props.code, language: props.language }).then(result => {
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