import { createMethaneNuxtConfig } from '@methane/ssr-nuxt';

const methane = createMethaneNuxtConfig();

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  telemetry: false,
  css: ['@methane/tokens/tokens.css', '@methane/css/index.css'],
  vue: methane.vue,
  nitro: methane.nitro,
});
