<template>
    <CodeLayout 
      ref="codeLayout"
      :layout-config="config"
      style="height: 400px"
       :mainMenuConfig="menuData"
    >
      <template #panelRender="{ panel }">
        <!--
          每个面板都会调用此插槽来渲染，你可以根据 
          panel.name 来判断当前是那个面板，渲染对应内容 
        -->

        <v-list
          :lines="false"
          density="compact"
          nav
        >
          <v-list-item
            v-for="(item, i) in items"
            :key="i"
            :value="item"
            color="primary"
          >
            <template v-slot:prepend>
              <v-icon :icon="item.icon"></v-icon>
            </template>

            <v-list-item-title v-text="item.text"></v-list-item-title>
          </v-list-item>
        </v-list>
        <span>Panel {{ debug(panel).name }}, content xxx</span>
      </template>
    </CodeLayout>
  </template>
  
  <script lang="ts" setup>
  import { ref, reactive, onMounted, nextTick, h } from 'vue';
  // import { type CodeLayoutConfig, type CodeLayoutInstance, defaultCodeLayoutConfig } from 'vue-code-layout';
  import IconFile from './examples/assets/icons/IconFile.vue';
  import IconSearch from './examples/assets/icons/IconSearch.vue';
  import type { MenuOptions } from '@imengyu/vue3-context-menu';
  
  const items = [
        { text: 'My Files', icon: 'mdi-folder' },
        { text: 'Shared with me', icon: 'mdi-account-multiple' },
        { text: 'Starred', icon: 'mdi-star' },
        { text: 'Recent', icon: 'mdi-history' },
        { text: 'Offline', icon: 'mdi-check-circle' },
        { text: 'Uploads', icon: 'mdi-upload' },
        { text: 'Backups', icon: 'mdi-cloud-upload' },
      ]

  const debug = (param)=>{
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
    secondarySideBarWidth: 20,
    secondarySideBarMinWidth: 170,
    secondarySideBarAsActivityBar:true,
    bottomPanelHeight: 30,
    bottomPanelMinHeight: 20,
    bottomAlignment: 'center',
    panelHeaderHeight: 24,
    panelMinHeight: 150,
    titleBar: true,
    titleBarShowCustomizeLayout: true,
    activityBar: true,
    primarySideBar: true,
    secondarySideBar: true,
    bottomPanel: true,
    statusBar: true,
    menuBar: true,
    bottomPanelMaximize: false
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
      data:{key:'hello world'},
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
    groupExplorer.addPanel({
      title: '服务器',
      tooltip: 'gpt服务器地址',
      name: 'server.addr',
      noHide: true,
      startOpen: true,
      data:{key:'hello world'},
      iconSmall: () => h(IconSearch),
      actions: [
        { 
          name: 'test',
          icon: () => h(IconSearch),
          onClick() {},
        },
        { 
          name: 'test2',
          icon: () => h(IconFile),
          onClick() {},
        },
      ]
    });
    groupExplorer.addPanel({
      title: '插件',
      tooltip: '已加载的插件',
      name: 'explorer.outline',
      iconSmall: () => h(IconSearch),
      actions: [
        { 
          name: 'test',
          icon: () => h(IconSearch),
          onClick() {},
        },
        { 
          name: 'test2',
          icon: () => h(IconFile),
          onClick() {},
        },
      ]
    });
  
    //向底栏加入面板
    bottomGroup.addPanel({
      title: '输出',
      tooltip: '输出',
      name: 'bottom.ports',
      startOpen: true,
      iconSmall: () => h(IconSearch),
    });
    bottomGroup.addPanel({
      title: '终端',
      tooltip: '终端',
      name: 'bottom.terminal',
      actions: [
        { 
          name: 'test',
          icon: () => h(IconSearch),
          onClick() {},
        },
        { 
          name: 'test2',
          icon: () => h(IconFile),
          onClick() {},
        },
      ]
    });
  }
  
  onMounted(() => {
    nextTick(() => {
      loadLayout();
    });
  });
  const menuData : MenuOptions = {
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