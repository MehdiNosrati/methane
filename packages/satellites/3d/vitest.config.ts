import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  oxc: {
    assumptions: {
      setPublicClassFields: true,
    },
    decorator: {
      legacy: true,
    },
  },
  resolve: {
    alias: [
      {
        find: /^@methane\/3d\/([^/]+)\/element(?:\.js)?$/,
        replacement: resolve(__dirname, 'src/components/$1/element.ts'),
      },
      {
        find: /^@methane\/3d\/([^/]+)$/,
        replacement: resolve(__dirname, 'src/components/$1/index.ts'),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
