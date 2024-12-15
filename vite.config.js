import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      stream: 'stream-browserify',
      util: 'util',
    }
  },
  define: {
    global: 'window',
  },
  plugins: [react(), nodePolyfills()],
});
