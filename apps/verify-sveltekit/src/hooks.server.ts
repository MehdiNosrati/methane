import { registerUtilityElements } from '@methane/primitives';
import { createMethaneHandle } from '@methane/ssr-sveltekit';
import { registerAllComponents } from '@methane/ui';
import type { Handle } from '@sveltejs/kit';

registerUtilityElements();
registerAllComponents();

export const handle: Handle = createMethaneHandle({
  assetBase: '/methane/styles',
  hydrationModuleUrl: '/assets/methane-sveltekit-hydrate.js',
}) as Handle;
