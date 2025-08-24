import { createApp } from 'vue'
import { createPinia } from 'pinia'

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.mount('#app')



import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { useAuthStore } from './stores/auth'

const app = createApp(App)
app.use(createPinia())

const auth = useAuthStore();

auth.init().then(() => {
  router.beforeEach((to, from, next) => {
    // Not logged in? 
    if (to.name == 'protected' && auth.isLoggedIn == false) {
    // Redirect to login if going to a protected route
      next({ name: 'login' })
    } else {
      next()
    }
  })
  app.use(router)
  app.mount('#app')
})