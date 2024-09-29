import { createApp } from "vue";
import { createPinia } from "pinia";

import "./styles/index.scss";
import "./permission";
import App from "./App.vue";
import router from "./router";
import { errorHandler } from "./error";
import "./utils/hackIpcRenderer";

// Vuetify 配置
import 'vuetify/styles' // 引入 Vuetify 的全局样式
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// 创建 Vuetify 实例
const vuetify = createVuetify({
  components,
  directives,
})

const app = createApp(App);
const store = createPinia();
app.use(router);
app.use(store);
app.use(vuetify);
errorHandler(app);

import 'vue-code-layout/lib/vue-code-layout.css'
import 'dockview-core/dist/styles/dockview.css';
import CodeLayout from 'vue-code-layout'
app.use(CodeLayout)

app.mount("#app");
