import { registerUtilityElements } from '@methane/primitives';
import { initAstroHydration } from '@methane/ssr-astro/client';
import { registerAllComponents } from '@methane/ui';

initAstroHydration();
registerUtilityElements();
registerAllComponents();
