import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GH_PAGES ? '/prs/' : '/',
  plugins: [
    react({
      babel: {
        plugins: [
          // Inject data-source attribute for AI agent source location
          './scripts/babel-plugin-jsx-source-location.cjs',
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // 拆分常驻依赖：浏览器可并行下载，且跨版本命中 immutable 缓存。
        // 应用代码与按等级加载的词库 chunk 因此不受依赖体积影响。
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'vendor-motion';
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'vendor-react';
          if (id.includes('node_modules/lucide-react/')) return 'vendor-icons';
          return 'vendor';
        },
      },
    },
  },
});
