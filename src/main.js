import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import { loadFonts } from './plugins/webfontloader';
import './firebase';

loadFonts();

const app = createApp(App);

app.use(vuetify);

// Registrar Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(() => {
    console.log("Service Worker registrado!");
  }).catch(error => {
    console.error("Erro ao registrar o Service Worker:", error);
  });
}

app.mount('#app');
