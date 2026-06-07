import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Bizquip dashboard — Mode B (hand-made, no DSN). Data comes from the n8n
// read-only SQL webhook on the Bizquip VM (see n8n/Bizquip Results Engine - KPI Feed.json).
// The browser POSTs {sql} to /feed; the Vite proxy forwards it server-side to the
// webhook, so there's no browser CORS preflight and the URL stays out of client JS.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/feed': {
          target: env.VITE_BIZQUIP_WEBHOOK_BASE,
          changeOrigin: true,
          secure: false,
          rewrite: () => env.VITE_BIZQUIP_WEBHOOK_PATH,
        },
      },
    },
  }
})
