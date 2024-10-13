<template>
  <div style="display: flex;flex-direction: column;">
    <div style="position: relative;">
      <CodeTools :code="code" :language="orange_language" :id="instrunctId" />
    </div>
    <div ref="terminalWrapper" style="flex: 1;">
      <vue-monaco-editor v-model:value="code" :language="language" theme="vs-dark" @mount="onEditorMounted"
        @change='change' :options="editorOptions" @mounted="onEditorMounted" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createVNode, onMounted, ref, render, shallowRef } from 'vue'
import CodeTools from './CodeTools.vue';
import * as monaco from 'monaco-editor';
import { InstructContent } from '@main/ipc/code-manager';
import CodeDiff from './CodeDiff.vue';
import { getIpcApi } from '@renderer/ts/ipc-api';
import { IpcEventHandler } from '@renderer/ts/default-ipc';

const code = ref<string>(`// Initial code here
function test() {
  console.log('Hello World');
  resolve('hello resolve')
}
test()
`);
const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null);
const decorations = ref<string[]>([]);
const currentLine = ref<number>(2); // 当前执行的行，默认是第2行
const language = ref('shell')
const instrunctId = ref('1')
const orange_language = ref(language.value)
const decorationsCollection = ref<monaco.editor.IEditorDecorationsCollection>(null);

const codeApi = getIpcApi<IpcEventHandler>('code-view-api');

// 配置编辑器选项
const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  fontSize: 14,
  glyphMargin: true, // 启用行号左侧标记
  formatOnType: true,
  formatOnPaste: true,
}

const onEditorMounted = (editorInstance: monaco.editor.IStandaloneCodeEditor) => {
  editor.value = editorInstance;  // 确保正确地将 editorInstance 赋值给 editor.value
  // window.editor = editorInstance;
  if (editor.value) {
    // executeLine(currentLine.value);
  } else {
    console.error("Failed to mount Monaco editor instance.");
  }
};
const change = (editorInstance: monaco.editor.IStandaloneCodeEditor) => {
  editor.value = editorInstance;  // 确保正确地将 editorInstance 赋值给 editor.value
  if (editor.value) {
    // executeLine(currentLine.value);
  } else {
    console.error("Failed to mount Monaco editor instance.");
  }
};

// setTimeout(() => {
//   executeLine(currentLine.value);
// }, 10000);

const setExecutionMarker = (lineNumber: number) => {
  if (editor.value) {
    console.log(`code : ${code.value}`);
    decorationsCollection.value = editor.value.createDecorationsCollection([
      {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          linesDecorationsClassName: 'my-glyph-margin-class',
        },
      }
    ])

    // [
    //   {
    //     range: new monaco.Range(1, 1, 1, 1),
    //     options: {
    //       isWholeLine: true,
    //       glyphMarginClassName: 'my-glyph-margin-class',
    //     }
    //   }
    // ]);
  } else {
    console.error("Editor instance is not available to set decorations.");
  }
};
let viewZoneId;
function removeInlineDiff(editor) {
  if (viewZoneId !== null) {
    editor.changeViewZones(accessor => {
      accessor.removeZone(viewZoneId);
    });
    viewZoneId = null; // 清空 ID，确保只能删除已存在的 ViewZone
  }
}
// 插入 Vue 组件作为 ViewZone 的内容
function insertVueInlineDiff(editor, lineNumber, diffContent) {
  const lines = diffContent.split('\n').length;
  editor.changeViewZones(accessor => {
    // 创建 DOM 节点作为 ViewZone 的容器
    const domNode = document.createElement('div');
    domNode.className = 'inline-vue-viewzone';

    // 创建虚拟 DOM，并渲染到 ViewZone 中
    const vnode = createVNode(CodeDiff, { content: diffContent });
    render(vnode, domNode);

    // 定义 ViewZone
    const viewZone = {
      afterLineNumber: lineNumber,
      heightInLines: lines, // 根据组件内容调整高度
      domNode: domNode,
    };

    // 添加 ViewZone
    viewZoneId = accessor.addZone(viewZone);
  });
}

codeApi.on('codeViewApi.code', (code_content: InstructContent) => {
  console.log('指令信息:', code_content)
  code_content = code_content[0]
  code.value = code_content.code;
  instrunctId.value = code_content.id;
  orange_language.value = code_content.language
  if (code_content.language === 'shell' || code_content.language === 'bash' || code_content.language === 'cmd') {
    code_content.language = 'shell'
  }
  language.value = code_content.language;
})

codeApi.on('codeViewApi.insertLine', (event: any, lineDiff: { code: string, line: number }) => {
  const { code, line } = lineDiff;
  console.log("执行完毕", JSON.stringify(lineDiff))
  try {
    insertVueInlineDiff(editor.value, line, code);
    throw new Error('')
  } catch (error) {
    console.error(`执行出错:`, error);
    // 你可以在这里添加自定义的错误处理，例如发送通知或日志记录
  }
}
)


const editorRef = shallowRef()
// your action
function formatCode() {
  editorRef.value?.getAction('editor.action.formatDocument').run()
}

const editorInstance = ref(null);

const currentExecutionLine = ref(null); // 存储当前执行行号

// function setExecutionMarker(lineNumber) {
//   // 如果已经有执行标志，移除它
//   if (currentExecutionLine.value) {
//     editorInstance.value.deltaDecorations(currentExecutionLine.value, []);
//   }

//   // 添加新的执行标志
//   const decorations = editorInstance.value.deltaDecorations([], [
//     {
//       range: new monaco.Range(lineNumber, 1, lineNumber, 1),
//       options: {
//         isWholeLine: true,
//         glyphMarginClassName: 'my-glyph-margin',  // 自定义CSS类来显示图标
//       },
//     },
//   ]);

//   currentExecutionLine.value = decorations; // 存储装饰ID以便后续移除
// }
function showExecutionResult(lineNumber, result) {
  const resultLine = lineNumber + 1;

  // 在结果行插入显示区域
  editor.value.createDecorationsCollection([
    {
      range: new monaco.Range(resultLine, 1, resultLine, 1),
      options: {
        isWholeLine: true,
        afterContentClassName: 'execution-result', // 自定义CSS类来显示执行结果
        after: {
          content: `Result: ${result}`, // 显示执行结果
          inlineClassName: 'result-text',
        },
      },
    },
  ]);
}
// window.showExecutionResult = showExecutionResult;
</script>
<style scoped>
/* 自定义样式，用于执行标记的图标 */
:deep(.my-glyph-margin-class) {
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="#f00" width="16" height="16" viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5z"/></svg>');
  background-size: 16px;
  border: 1px solid #F00;
  width: 16px;
  height: 16px;
}

:deep(execution-result) {
  display: block;
  color: #28a745;
}

:deep(.result-text) {
  font-style: italic;
  color: #f00;
}
</style>