import { createApp } from "vue";
import { plugin, defaultConfig } from "@formkit/vue";
import App from "./App.vue";
import formKitConfig from "../formkit.config";
import { createRouter, createWebHistory } from "vue-router";
import Authenticate from "./components/Authenticate.vue";
import BookingForm from "./components/BookingForm.vue";
import Products from "./components/Products.vue";
import OrderForm from "./components/OrderForm.vue";
import SelectZipCodes from "./components/SelectZipCodes.vue";

const routes = [
  { path: "/authenticate", component: Authenticate },
  { path: "/", component: BookingForm },
  { path: "/products", component: Products },
  { path: "/order", component: OrderForm },
  { path: "/zipcodes", component: SelectZipCodes },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);
app.use(plugin, defaultConfig(formKitConfig));
app.use(router);
app.mount("#app");
