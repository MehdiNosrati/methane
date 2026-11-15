import { registerUtilityElements } from '@methane-ui/primitives';
import { initSvelteKitHydration } from '@methane-ui/ssr-sveltekit/client';
import { registerAllComponents } from '@methane-ui/ui';

initSvelteKitHydration();
registerUtilityElements();
registerAllComponents();
