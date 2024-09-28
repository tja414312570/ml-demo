<template>
  <title-bar />
  <!-- <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view> -->
  <!-- <CodeLayout /> -->
  <DockviewVue />
</template>

<script setup lang="ts">
import TitleBar from "@renderer/components/title-bar/title-bar.vue";
</script>


<script lang="ts">
import { defineComponent } from 'vue'

//导入组件
import { CodeLayout } from 'vue-code-layout';

import { DockviewVue } from "dockview-vue";

</script>
<style></style>
