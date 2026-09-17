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
        /*
         * Origin을 떼고 보낸다. 서버 CORS가 지금 어떤 오리진도 허용하지 않아
         * (SecurityConfig가 .cors()를 두 번 불러 와일드카드를 못 쓰는 쪽이 이긴다)
         * Origin이 붙은 요청은 전부 403 "Invalid CORS request"가 된다.
         *
         * 프록시는 서버-투-서버라 CORS 대상이 아니므로 헤더만 떼면 통과한다.
         * **BE가 CORS를 고치면 이 블록은 지운다** — 로컬 우회일 뿐이고,
         * 배포(Vercel rewrite)에는 이런 처리가 없어 서버 수정이 반드시 필요하다.
         */
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        },
      },
    },
  },
})
