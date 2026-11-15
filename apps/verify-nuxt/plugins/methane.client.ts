import { registerUtilityElements } from '@methane/primitives';
import { initNuxtHydration } from '@methane/ssr-nuxt/client';
import { registerAllComponents } from '@methane/ui';

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    initNuxtHydration();
    registerUtilityElements();
    registerAllComponents();
  }
});
