<template>
    <div class="diff-content">
        <div style="" v-html="view"></div>
        <div>
            <v-tooltip bottom>
                <template v-slot:activator="{ props }">
                    <v-icon small v-bind="props" @click="send" color="blue">mdi-send-outline</v-icon>
                </template>
                <span>发送结果</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ props }">
                    <v-icon small v-bind="props" @click="del" color="blue">mdi-close-outline</v-icon>
                </template>
                <span>删除</span>
            </v-tooltip>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { AnsiUp } from 'ansi-up';
import { defineProps, ref, Ref, watch } from 'vue';



interface Props {
    content: Ref<string>;
    del: () => void;
    send: () => void;
}


const onMessage = (message) => {
    console.log("删除", message)
}
defineExpose({
    onMessage
})
const props = defineProps<Props>();

const ansiUp = new AnsiUp();
const view = ref('')
watch(
    () => props.content,
    (newValue) => {
        view.value = ansiUp.ansi_to_html(newValue.value);
    },
    { deep: true } // 深度监听对象
);

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
    white-space: pre-line;
}
</style>