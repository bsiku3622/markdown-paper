import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { themeBootScript } from '@studio-baeks/paper-ui/theme-boot';
const themeBoot={name:'theme-boot',transformIndexHtml:()=>[{tag:'script',children:themeBootScript({defaultTheme:'light'}),injectTo:'head-prepend' as const}]};
export default defineConfig({plugins:[react(),themeBoot]});
