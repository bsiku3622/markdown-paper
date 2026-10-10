import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({base:'./',plugins:[react()],build:{outDir:'cli/renderer',emptyOutDir:true,rollupOptions:{input:resolve('cli/render.html')}}});
