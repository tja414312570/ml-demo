<template>
    <vue-monaco-editor
      v-model:value="code"
      language="shell"
      theme="vs-dark"
      :options="MONACO_EDITOR_OPTIONS"
      @mount="handleMount"
    />
  </template>
  
  <script lang="ts" setup>
  import { ref, shallowRef } from 'vue'
  
  const MONACO_EDITOR_OPTIONS = {
    automaticLayout: true,
    formatOnType: true,
    formatOnPaste: true,
  }
  
  const code = ref(`#!/bin/bash
# 创建一个名为 myenv 的虚拟环境
python3 -m venv myenv

# 激活虚拟环境
source myenv/bin/activate

# 安装 requests 和 pandas 包
pip install requests pandas

# 输出已安装的包
pip list

# 结束虚拟环境
deactivate
`)
  const editorRef = shallowRef()
  const handleMount = editor => (editorRef.value = editor)
  
  // your action
  function formatCode() {
    editorRef.value?.getAction('editor.action.formatDocument').run()
  }
  </script>