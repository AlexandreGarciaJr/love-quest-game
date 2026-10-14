import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Publicado na raiz do domínio da Vercel, então o base padrão "/" basta.
export default defineConfig({
  plugins: [react()],
  // O Phaser sozinho passa de 1 MB; ele já fica num arquivo separado, carregado sob demanda.
  build: { chunkSizeWarningLimit: 1600 },
});
