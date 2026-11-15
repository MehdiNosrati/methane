import { registerUtilityElements } from '@methane/primitives';
import { initNuxtHydration } from '@methane/ssr-nuxt/client';

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    initNuxtHydration();
    registerUtilityElements();
  }
});
