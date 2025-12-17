import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// 開發環境路由重寫中間件
function mediaDetailRewritePlugin() {
  return {
    name: 'media-detail-rewrite',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rewrites = [
          { pattern: /^\/books\/(\d+)$/, destination: '/book-detail?id=$1' },
          { pattern: /^\/movies\/(\d+)$/, destination: '/movie-detail?id=$1' },
          { pattern: /^\/games\/(\d+)$/, destination: '/game-detail?id=$1' },
          { pattern: /^\/anime\/(\d+)$/, destination: '/anime-detail?id=$1' },
          { pattern: /^\/tv\/(\d+)$/, destination: '/tv-detail?id=$1' },
          { pattern: /^\/podcasts\/(\d+)$/, destination: '/podcast-detail?id=$1' },
          { pattern: /^\/documentaries\/(\d+)$/, destination: '/documentary-detail?id=$1' },
        ];

        for (const { pattern, destination } of rewrites) {
          const match = req.url.match(pattern);
          if (match) {
            req.url = destination.replace('$1', match[1]);
            break;
          }
        }
        next();
      });
    }
  };
}

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  vite: {
    plugins: [mediaDetailRewritePlugin()],
    server: {
      proxy: {
        '/api': {
          target: 'https://pyqapi.3331322.xyz',
          changeOrigin: true,
          secure: true,
        },
      }
    }
  }
});
