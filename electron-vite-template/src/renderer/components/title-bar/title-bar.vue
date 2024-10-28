<template>
  <div class="window-title" v-if="isNotMac">
    <!-- 软件logo预留位置 -->
    <div style="-webkit-app-region: drag" class="logo">
      <img src="@renderer/assets/icons/svg/electron-logo.svg" class="icon-logo" />
    </div>
    <!-- 菜单栏位置 -->
    <div></div>
    <!-- 中间标题位置 -->
    <div style="-webkit-app-region: drag" class="title">设置</div>
    <div class="window-controls">
      <i id="minimize" class="mdi mdi-window-minimize" @click="api.invoke('minimize')"></i>
      <i id="maximize" class="mdi mdi-window-maximize" v-show="!isMax"
        @click="api.invoke('maximize') && (isMax = true)"></i>
      <i id="restore" class="mdi mdi-window-restore" v-show="isMax"
        @click="api.invoke('restore') && (isMax = false)"></i>
      <i id="close" class="mdi mdi-close" @click="api.invoke('close')"></i>
    </div>
  </div>
  <div v-else-if="!IsUseSysTitle && !isNotMac" class="window-title">
    <div style="-webkit-app-region: drag" class="title">设置</div>
  </div>
</template>

<script setup lang="ts">
import { getIpcApi } from "@lib/preload";
import { ref } from "vue";
import { tr } from "vuetify/locale";
const isMax = ref(false)

const api = getIpcApi('ipc-core.window');
const coreApi: any = getIpcApi('ipc-core');
const IsUseSysTitle = ref(false);
api.invoke('isMaximized').then(result => {
  isMax.value = result;
})
const mix = ref(false);
// const isNotMac = ref(false);

console.log(coreApi.platform)
const isNotMac = ref(coreApi.platform !== 'darwin');
// const IsWeb = ref(Boolean(__ISWEB__));
const IsWeb = ref(Boolean(false));

// isNotMac.value = systemInfo.platform !== "darwin";

// ipcRendererChannel.IsUseSysTitle.invoke().then((res) => {
//   IsUseSysTitle.value = res;
// });
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.window-title {
  width: 100%;
  height: 30px;
  line-height: 30px;
  display: flex;
  // -webkit-app-region: drag;
  top: 0;
  z-index: 99999;
  justify-content: center;
  align-items: center;

  .icon-logo {
    width: 1em;
    height: 1em;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
  }

  .title {
    text-align: center;
    color: #9d9d9d;
  }

  .logo {
    margin: 0 10px;
  }

  .controls-container {
    display: flex;
    flex-grow: 0;
    flex-shrink: 0;
    text-align: center;
    position: relative;
    z-index: 3000;
    -webkit-app-region: no-drag;
    height: 100%;
    width: 138px;
    margin-left: auto;

    .windows-icon-bg {
      display: inline-block;
      -webkit-app-region: no-drag;
      height: 100%;
      width: 33.34%;
      color: rgba(129, 129, 129, 0.6);

      .icon-size {
        width: 12px;
        height: 15px;
        vertical-align: -0.15em;
        fill: currentColor;
        overflow: hidden;
      }
    }

    .windows-icon-bg:hover {
      background-color: rgba(182, 182, 182, 0.2);
      color: #333;
    }

    .close-icon:hover {
      background-color: rgba(232, 17, 35, 0.9);
      color: #fff;
    }
  }
}

.window-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 10px;
}

.window-controls i {
  font-size: 24px;
  /* 图标大小 */
  cursor: pointer;
  margin: 0 10px;
}

.window-controls i:hover {
  color: #f00;
  /* 鼠标悬停时的颜色 */
}
</style>
