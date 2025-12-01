import { createApp } from "vue"
import { createPinia } from "pinia"

import App from "./App.vue"
import router from "./router"

// Import Sheets ORM
import { createSheetsORM } from "@/sheets-orm"
import config from "@/config/sheets-orm.config"

async function bootstrap() {
  const app = createApp(App)

  app.use(createPinia())
  app.use(router)

  // Install Sheets ORM
  const sheetsORM = createSheetsORM(config)

  // Ensure Google API client is initialized (loads gapi and restores tokens)
  await sheetsORM.db.initialize()
  // app.use(sheetsORM)

  app.mount("#app")
}

bootstrap().catch((err) => {
  console.error("Failed to bootstrap app:", err)
})
