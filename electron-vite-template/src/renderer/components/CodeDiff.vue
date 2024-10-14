<template>
    <div class="diff-content">
        <pre style="white-space: break-spaces;">{{ content }}</pre>
        <div>
            <v-tooltip bottom>
                <template v-slot:activator="{ props }">
                    <v-icon small v-bind="props" @click="handleExecute" color="blue">mdi-play-circle</v-icon>
                </template>
                <span>执行代码</span>
            </v-tooltip>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue';

interface Props {
    content: string;
}

const handleExecute = () => {
    console.log("删除")
}

const props = defineProps<Props>();
</script>

<style scoped>
.diff-content {
    background-color: #3b3f51;
    color: #ffffff;
    border: 1px solid #d19a66;
    white-space: pre-wrap;
    width: calc(100% - 16px);
    z-index: 10;
    /* 设置为较高值确保其显示在顶部 */
    position: relative;
    /* 相对定位以启用 z-index */
}

pre {
    user-select: text;
}
</style>