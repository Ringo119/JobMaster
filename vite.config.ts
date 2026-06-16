import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Served from a GitHub Pages project site at /<repo>/. Update this if the
  // repository is renamed (e.g. to '/JobMaster/').
  base: '/TenderTrack/',
  plugins: [react()],
});
