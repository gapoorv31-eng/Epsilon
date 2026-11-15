/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite builds the React app; the "test" section configures Vitest.
// In production builds (`npm run build` / `npm run preview`), base is '/Epsilon/'
// for GitHub Pages; in development (`npm run dev`), base remains '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Epsilon/' : '/',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
  },
}));
