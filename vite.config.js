import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  base: '/prs/',
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
});
