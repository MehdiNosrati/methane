import { registerUtilityElements } from '@methane-ui/primitives';
import { initNuxtHydration } from '@methane-ui/ssr-nuxt/client';
import { registerAllComponents } from '@methane-ui/ui';

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    initNuxtHydration();
    registerUtilityElements();
    registerAllComponents();
  }
});
