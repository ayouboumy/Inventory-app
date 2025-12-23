import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // This is critical: it replaces process.env.API_KEY in your code
      // with the actual value from the environment during build time.
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});