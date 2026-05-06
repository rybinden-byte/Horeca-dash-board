import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Horeca-dash-board/',
  plugins: [react()],
  server: { port: 5174 },
});
