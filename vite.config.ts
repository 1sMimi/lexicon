import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({base:'./',build:{cssMinify:false,minify:false,modulePreload:false},plugins:[react(),VitePWA({registerType:'prompt',injectRegister:false,includeAssets:['icon.svg'],manifest:{name:'Lexicon — Read. Learn. Remember.',short_name:'Lexicon',description:'Your personal vocabulary and reading workspace',theme_color:'#D9F36B',background_color:'#F8F9FA',display:'standalone',start_url:'./',icons:[{src:'icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]},workbox:{globPatterns:['**/*.{js,mjs,css,html,svg,woff2}','data/core-v2.json','data/provenance.json','data/ECDICT-LICENSE.txt'],maximumFileSizeToCacheInBytes:8000000}})]});
