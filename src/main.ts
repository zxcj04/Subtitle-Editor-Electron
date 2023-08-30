import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import vuetify from "@/plugins/vuetify";
import VueVideoPlayer from "@/plugins/video";
import VueCodemirror from "vue-codemirror";

createApp(App)
  .use(vuetify)
  .use(VueVideoPlayer)
  .use(VueCodemirror)
  .mount("#app");
