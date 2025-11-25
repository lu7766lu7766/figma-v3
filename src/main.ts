import { createApp } from "vue"
import { createPinia } from "pinia"

import Prectice from "./prectice.vue"
import router from "./router"

const app = createApp(Prectice)

app.use(createPinia())
app.use(router)

app.mount("#app")
