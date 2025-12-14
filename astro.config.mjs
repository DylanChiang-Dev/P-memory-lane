import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  vite: {
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
