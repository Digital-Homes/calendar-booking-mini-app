import { createApp } from 'vue';
import { plugin, defaultConfig } from '@formkit/vue';
import App from './App.vue';
import formKitConfig from '../formkit.config';
import { createRouter, createWebHistory } from 'vue-router';
import BookingForm from './components/BookingForm.vue';
import Products from './components/Products.vue';

const routes = [
  { path: '/', component: BookingForm },
  { path: '/products', component: Products },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);
app.use(plugin, defaultConfig(formKitConfig));
app.use(router);
app.mount('#app');
