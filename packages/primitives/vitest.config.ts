import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    assumptions: {
      setPublicClassFields: true,
    },
    decorator: {
      legacy: true,
    },
  },
  test: {
    environment: 'jsdom',
  },
});
