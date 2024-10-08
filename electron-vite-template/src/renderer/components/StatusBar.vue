<template>
    <div class="status-bar">
        <div class="status-bar-left">
            <!-- 扩展区域插槽 -->
            <slot name="extension"></slot>
        </div>

        <div class="status-bar-center">
            <!-- 中间区域，显示其他信息 -->
            <p>{{ editor_status }}</p>
        </div>

        <div class="status-bar-right">
            <!-- 始终显示通知内容和图标 -->
            <div v-if="notification" :class="['notification-text', { 'error': notification.is_error }]">
                {{ notification.message }}
            </div>
            <!-- <v-icon small :class="{ 'error': notification?.is_error }">mdi-bell</v-icon> -->
            <button v-if="notification" @click="clearNotification">清除通知</button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 使用 ref 定义响应式数据
const editor_status = ref('编辑器状态信息');
const notification = ref<{ message: string; is_error: boolean } | null>(null);

// 监听来自预加载脚本的通知
onMounted(() => {
    // 监听通知事件
    window.notificationAPI.onReady();
    window.notificationAPI.onNotify((notifyData) => {
        console.log(`收到通知：${notifyData}`)
        notification.value = notifyData;
    });

    // 监听清理通知事件
    window.notificationAPI.onClearNotification(() => {
        notification.value = null;
    });
});

// 清除通知方法
const clearNotification = () => {
    window.notificationAPI.clearNotification();
};
</script>

<style scoped>
.status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 5px;
    height: 20px;
}

.status-bar-left {
    flex: 1;
    display: flex;
    align-items: center;
}

.status-bar-center {
    flex: 2;
    text-align: center;
    font-size: 12px;
}

.status-bar-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    overflow: hidden;
}

.notification-text {

    font-size: 12px;
    overflow: hidden;
    /* 隐藏超出容器的内容 */
    text-overflow: ellipsis;
    /* 当内容溢出时显示省略号 */
    white-space: nowrap;
    /* 强制内容在一行显示，禁止换行 */
    word-break: break-all;
    /* 在单词内任意位置断行 */
    overflow-wrap: break-word;
    /* 优先在单词边界断行 */
}

.notification-text.error,
.mdi-bell.error {
    color: red;
    /* 错误通知显示为红色 */
}

.status-bar-right .v-icon {
    font-size: 14px;
    cursor: pointer;
}

button {
    margin-left: 10px;
    font-size: 12px;
}
</style>