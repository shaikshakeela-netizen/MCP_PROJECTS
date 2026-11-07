import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import pkg from './package.json';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const bridgeTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000';

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    server: {
      port: 5173,
      // In development, /api requests go to the FastAPI bridge, so no CORS setup is needed.
      proxy: { '/api': { target: bridgeTarget, changeOrigin: true } },
    },
  };
});
