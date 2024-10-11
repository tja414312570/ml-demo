<template>
  <div style="position: relative;">
    <CodeTools :code="code" :language="orange_language" />
  </div>
  <div style="top: 40px;bottom:0;left:0;right:0;position: absolute;">
    <div ref="terminalWrapper" style="position: relative;width: 100%;height: 100%;">
      <vue-monaco-editor v-model:value="code" :language="language" theme="vs-dark" :options="MONACO_EDITOR_OPTIONS"
        @mount="handleMount" />
    </div>
  </div>

</template>

<script lang="ts" setup>
import { ref, shallowRef } from 'vue'
import CodeTools from './CodeTools.vue';

const MONACO_EDITOR_OPTIONS = {
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
}
const language = ref('shell')
const orange_language = ref(language.value)
const code = ref(`等待输入指令`)
window.codeViewApi.onCode(code_content => {
  console.log('指令信息:', code_content)
  code_content = code_content[0]
  code.value = code_content.code;
  orange_language.value = code_content.language
  if (code_content.language === 'shell' || code_content.language === 'bash' || code_content.language === 'cmd') {
    code_content.language = 'shell'
  }
  language.value = code_content.language;
})
const editorRef = shallowRef()
const handleMount = editor => (editorRef.value = editor)

// your action
function formatCode() {
  editorRef.value?.getAction('editor.action.formatDocument').run()
}
</script>