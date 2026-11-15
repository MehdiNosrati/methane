import { createMethaneNuxtConfig } from '@methane-ui/ssr-nuxt';

const methane = createMethaneNuxtConfig();

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  telemetry: false,
  css: ['@methane-ui/tokens/tokens.css', '@methane-ui/css/index.css'],
  vue: methane.vue,
  nitro: methane.nitro,
});
