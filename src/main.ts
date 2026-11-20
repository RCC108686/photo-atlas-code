import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { catalogKey } from './lib/keys'
import { loadCatalog } from './lib/catalog'
import './style.css'

async function bootstrap() {
  const catalog = await loadCatalog()
  const app = createApp(App)
  app.provide(catalogKey, catalog)
  app.use(router)
  app.mount('#app')
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  const root = document.getElementById('app')
  if (root) {
    root.innerHTML = `<div class="boot-error">图鉴数据加载失败<br><span>${message}</span></div>`
  }
})
