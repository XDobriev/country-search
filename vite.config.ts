/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: {
    passWithNoTests: true,
    environment: 'node',
    globals: true,
  },
});
