import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import vuetify from '@/plugins/vuetify';
import VueCodemirror from 'vue-codemirror';

createApp(App)
  .use(vuetify)
  .use(VueCodemirror)
  .mount('#app')
