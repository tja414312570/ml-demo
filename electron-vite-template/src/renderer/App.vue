<template>
  <div class="vscode-layout">
    <DockView
      :panels="panels"
      :layout="layout"
      :on-panel-loaded="onPanelLoaded"
      ref="dockview"
    />
  </div>
</template>

<script lang="ts" setup>
import  DockView  from 'dockview-vue';
import EditorPanel from './components/EditorPanel.vue';
import TerminalPanel from './components/TerminalPanel.vue';

import {
    DockviewReadyEvent,
    IDockviewPanelProps,
} from 'dockview-vue';
</script>

<style scoped>
.vscode-layout {
  width: 100%;
  height: 100vh;
}
</style>
