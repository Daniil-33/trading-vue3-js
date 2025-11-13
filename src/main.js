import { createApp } from 'vue'
import App from './App.vue'

// MOB_DEBUG=true npm run dev - Enables mobile debugging
// (sending console output to the dev server terminal)
if (import.meta.env.VITE_MOB_DEBUG) {
    console.log = debug
    console.error = debug
    console.warn = debug
}

const app = createApp(App)
app.mount('#app')

function debug(...argv) {
    fetch('/debug?argv=' + JSON.stringify(argv))
}

