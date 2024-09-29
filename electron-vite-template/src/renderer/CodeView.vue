<template>
    <CodeLayout 
      ref="codeLayout"
      :layout-config="config"
      style="height: 400px"
    >
      <template #panelRender="{ panel }">
        <!--
          每个面板都会调用此插槽来渲染，你可以根据 
          panel.name 来判断当前是那个面板，渲染对应内容 
        -->
        <span>Panel {{ panel.name }}, content</span>
      </template>
    </CodeLayout>
  </template>
  
  <script lang="ts" setup>
  import { ref, reactive, onMounted, nextTick, h } from 'vue';
  //import { type CodeLayoutConfig, type CodeLayoutInstance, defaultCodeLayoutConfig } from 'vue-code-layout';
  import IconFile from './examples/assets/icons/IconFile.vue';
  import IconSearch from './examples/assets/icons/IconSearch.vue';
  
  //2. 定义布局的基础定义，这些数据控制了
  //几个主要部分的大小、位置、是否显示等等状态
  const config = reactive<CodeLayoutConfig>({
    //...defaultCodeLayoutConfig,
    primarySideBarSwitchWithActivityBar: true,
    primarySideBarPosition: 'left',
    primarySideBarWidth: 40,
    primarySideBarMinWidth: 170,
    activityBarPosition: 'side',
    secondarySideBarWidth: 20,
    secondarySideBarMinWidth: 170,
    bottomPanelHeight: 50,
    bottomPanelMinHeight: 40,
    bottomAlignment: 'center',
    panelHeaderHeight: 24,
    panelMinHeight: 150,
    titleBar: true,
    titleBarShowCustomizeLayout: true,
    activityBar: true,
    primarySideBar: true,
    secondarySideBar: false,
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
      title: 'VUE-CODE-LAYOUT',
      tooltip: 'vue-code-layout',
      name: 'explorer.file',
      noHide: true,
      startOpen: true,
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
      title: 'OUTLINE',
      tooltip: 'Outline',
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
      title: 'PORTS',
      tooltip: 'Ports',
      name: 'bottom.ports',
      startOpen: true,
      iconSmall: () => h(IconSearch),
    });
    bottomGroup.addPanel({
      title: 'TERMINAL',
      tooltip: 'Terminal',
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
  
  </script>