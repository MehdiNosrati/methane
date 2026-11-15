import { registerUtilityElements } from '@methane/primitives';
import { initSvelteKitHydration } from '@methane/ssr-sveltekit/client';
import { registerAllComponents } from '@methane/ui';

initSvelteKitHydration();
registerUtilityElements();
registerAllComponents();
