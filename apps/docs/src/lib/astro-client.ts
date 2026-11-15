import { registerUtilityElements } from '@methane-ui/primitives';
import { initAstroHydration } from '@methane-ui/ssr-astro/client';
import { registerAllComponents } from '@methane-ui/ui';

initAstroHydration();
registerUtilityElements();
registerAllComponents();
