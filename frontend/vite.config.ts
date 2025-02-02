import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./app"),
    },
  },
  root: ".", 
  build: {
    outDir: "dist", 
    emptyOutDir: true, 
  },
  server: {
    port: 5173, 
    open: true, 
  },
});
