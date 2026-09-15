import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Testes unitários da lógica pura (sem UI): `npm test`.
export default defineConfig({
  resolve: {
    alias: {
      'npm:vitest@4.1.11': 'vitest',
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js', 'base44/**/*.test.js'],
  },
});