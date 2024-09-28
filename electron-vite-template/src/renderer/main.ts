import { createApp } from "vue";
import { createPinia } from "pinia";

import "./styles/index.scss";
import "./permission";
import App from "./App.vue";
import router from "./router";
import { errorHandler } from "./error";
import "./utils/hackIpcRenderer";

const app = createApp(App);
const store = createPinia();
app.use(router);
app.use(store);
errorHandler(app);

import 'vue-code-layout/lib/vue-code-layout.css'
import 'dockview-core/dist/styles/dockview.css';
import CodeLayout from 'vue-code-layout'
app.use(CodeLayout)

app.mount("#app");
