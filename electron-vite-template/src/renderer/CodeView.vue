<template>
  <CodeLayout ref="codeLayout" :layout-config="config" style="height: 400px" :mainMenuConfig="menuData">
    <template #panelRender="{ panel }">
      <!--
          每个面板都会调用此插槽来渲染，你可以根据 
          panel.name 来判断当前是那个面板，渲染对应内容 
        -->
      <keep-alive>
        <component :is="getPannel(panel.name)" :panel="panel" />
      </keep-alive>

      <!-- <span>Panel {{ debug(panel).name }}, content xxx</span> -->
    </template>
    <!-- https://github.com/imengyu/vue-code-layout/blob/master/examples/views/BasicUseage.vue -->
    <template #centerArea>
      <!-- <MainWebView /> -->
    </template>
    <template #statusBar>
      <StatusBar />
    </template>
  </CodeLayout>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, nextTick, h } from 'vue';
import { type CodeLayoutConfig, type CodeLayoutInstance, defaultCodeLayoutConfig } from 'vue-code-layout';
import IconFile from './examples/assets/icons/IconFile.vue';
import IconSearch from './examples/assets/icons/IconSearch.vue';
import type { MenuOptions } from '@imengyu/vue3-context-menu';
import { getPannel, addPannel } from './ts/pannel-manager'
import ServerList from './components/ServerList.vue';
import { serverApi } from './api/server-api'
import MainWebView from './components/MainWebView.vue';
import CodeEdit from './components/CodeEdit.vue';
import XtermView from './components/XtermView.vue';
import StatusBar from './components/StatusBar.vue';
import CodeOutput from './components/CodeOutput.vue';
import PluginView from './components/PluginView.vue';
const MONACO_EDITOR_OPTIONS = {
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
};
addPannel("server.addr", ServerList)
addPannel("code.view", CodeEdit)
addPannel("bottom.terminal", XtermView)
addPannel("bottom.output", CodeOutput)

addPannel('primarySideBar.plugin', PluginView)
const debug = (param) => {
  console.log(param)
  return param;
}
//2. 定义布局的基础定义，这些数据控制了
//几个主要部分的大小、位置、是否显示等等状态
const config = reactive<CodeLayoutConfig>({
  //...defaultCodeLayoutConfig,
  primarySideBarSwitchWithActivityBar: true,
  primarySideBarPosition: 'left',
  primarySideBarWidth: 20,
  primarySideBarMinWidth: 170,
  activityBarPosition: 'side',
  bottomPanelHeight: 30,
  bottomPanelMinHeight: 20,
  bottomAlignment: 'center',
  panelHeaderHeight: 24,
  panelMinHeight: 150,
  titleBar: true,
  titleBarShowCustomizeLayout: true,
  activityBar: true,
  primarySideBar: true,
  bottomPanel: true,
  statusBar: true,
  menuBar: true,
  bottomPanelMaximize: false,
  secondarySideBar: true,
  secondarySideBarWidth: 20,
  secondarySideBarMinWidth: 170,
  secondarySideBarAsActivityBar: true,
  secondaryActivityBarPosition: 'side'
});

//定义实例
const codeLayout = ref<CodeLayoutInstance>();

/**
 * 3. 向组件中添加面板数据
 */
function loadLayout() {

  //向第一侧边栏添加两个组
  const groupExplorer = codeLayout.value.addGroup({
    title: 'Explorer',
    tooltip: 'Explorer',
    name: 'explorer',
    badge: '2',
    data: { key: 'hello world' },
    iconLarge: () => h(IconFile),
  }, 'primarySideBar');
  codeLayout.value.addGroup({
    title: 'Search',
    tooltip: 'Search',
    name: 'search',
    tabStyle: 'single',
    iconLarge: () => h(IconSearch),
  }, 'primarySideBar');

  //获取底栏实例网格
  const bottomGroup = codeLayout.value.getRootGrid('bottomPanel');

  //向第一侧边栏刚刚添加的组中再加入面板
  const server = {
    onAdd(arg) {
      console.log(`添加服务器:${arg}`)
    },
    onOpen(arg) {
      console.log(`打开服务器:${arg}`)
    }
  } as serverApi
  groupExplorer.addPanel({
    title: '服务器',
    tooltip: 'gpt服务器地址',
    name: 'server.addr',
    noHide: true,
    startOpen: true,
    data: { api: server },
    iconSmall: () => h(IconSearch),
    actions: [
      {
        name: '搜索',
        tooltip: '搜索服务',
        icon: () => h(IconSearch),
        onClick() { server.actionSearch("192") },
      },
      {
        name: '添加',
        tooltip: '添加服务',
        icon: () => h(IconFile),
        onClick() { server.actionAdd() },
      },
    ]
  });
  groupExplorer.addPanel({
    title: '插件',
    tooltip: '已加载的插件',
    startOpen: true,
    name: 'primarySideBar.plugin',
    iconSmall: () => h(IconSearch),
    data: {
      generateContent: () => h('div', '这是插件面板内容')
    },
    actions: [
      {
        name: 'test',
        icon: () => h(IconSearch),
        onClick() { },
      },
      {
        name: 'test2',
        icon: () => h(IconFile),
        onClick() { },
      },
    ]
  });
  const secondarySideBar = codeLayout.value.getRootGrid('secondarySideBar'); //获取第二侧边栏组

  console.log("secondarySideBar", secondarySideBar)
  // secondarySideBar.addPanel({
  //   title: '插件',
  //   tooltip: '已加载的插件',
  //   name: 'explorer.outline',
  //   iconSmall: () => h(IconSearch),
  //   data: {
  //   generateContent: () => h('div', '这是插件面板内容')
  // },
  //   actions: [
  //     { 
  //       name: 'test',
  //       icon: () => h(IconSearch),
  //       onClick() {},
  //     },
  //     { 
  //       name: 'test2',
  //       icon: () => h(IconFile),
  //       onClick() {},
  //     },
  //   ]
  // })

  const groupRight1 = codeLayout.value.addGroup({
    title: '代码试图',
    tooltip: '代码试图',
    name: 'code.view',
    tabStyle: "single",
    badge: "12",
    startOpen: true,
    actions: [
      {
        name: '调试',
        tooltip: "运行调试",
        icon: () => h(IconSearch),
        onClick() { },
      },],
    iconLarge: () => h(IconFile),
  }, 'secondarySideBar');



  bottomGroup.addPanel({
    title: '终端',
    tooltip: '终端',
    name: 'bottom.terminal',
    startOpen: true,
    actions: [
      {
        name: 'test',
        icon: () => h(IconSearch),
        onClick() { },
      },
      {
        name: 'test2',
        icon: () => h(IconFile),
        onClick() { },
      },
    ]
  });
  //向底栏加入面板
  bottomGroup.addPanel({
    title: '输出',
    tooltip: '输出',
    name: 'bottom.output',
    iconSmall: () => h(IconSearch),
  });

}

onMounted(() => {
  nextTick(() => {
    loadLayout();
  });
});
const menuData: MenuOptions = {
  x: 0,
  y: 0,
  items: [
    {
      label: "文件",
      children: [
        { label: "New" },
        { label: "Open" },
        {
          label: "Open recent",
          children: [
            { label: "File 1...." },
            { label: "File 2...." },
            { label: "File 3...." },
            { label: "File 4...." },
            { label: "File 5...." },
          ],
        },
        { label: "Save", divided: true },
        { label: "Save as..." },
        { label: "Close" },
        { label: "Exit" },
      ],
    },
    {
      label: "编辑",
      children: [
        { label: "Undo" },
        { label: "Redo" },
        { label: "Cut", divided: true },
        { label: "Copy" },
        { label: "Find", divided: true },
        { label: "Replace" },
      ],
    },
    {
      label: "窗口",
      children: [
        { label: "Zoom in" },
        { label: "Zoom out" },
        { label: "Reset zoom" },
        { label: "Full screent", divided: true },
        { label: "Find", divided: true },
        { label: "Replace" },
      ],
    },
    {
      label: "帮助",
      children: [
        { label: "关于" },
      ],
    },
  ],
  zIndex: 3,
  minWidth: 230,
};
</script>