import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

// https://vite.dev/config/
/**
 * 운영은 `vercel.json`의 rewrite가 `/api`를 백엔드로 넘기지만, 그건 Vercel에
 * 배포됐을 때만 동작한다. 로컬 `npm run dev`도 같은 경로로 붙도록 여기서 맞춘다
 * — 두 곳의 대상 주소가 어긋나면 로컬만 404가 난다.
 */
const API_TARGET = 'http://mulmeong-alb-35804808.ap-northeast-2.elb.amazonaws.com'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
})
