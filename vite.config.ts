import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

/**
 * Vite configuration for the schedule app.
 *
 * GitHub Pages serves a project site from /<repository>/, so the build needs
 * that base path while local development stays at the root. The base is also
 * what makes asset URLs work after deployment: without it the page loads and
 * every script 404s.
 */
export default defineConfig(({command}) => ({
  base: command === 'build' ? '/rasporyadok-dnya/' : '/',
  plugins: [react()],
}));
