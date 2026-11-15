import { registerUtilityElements } from '@methane/primitives';
import { createMethaneHandle } from '@methane/ssr-sveltekit';
import type { Handle } from '@sveltejs/kit';

registerUtilityElements();

export const handle: Handle = createMethaneHandle({
  assetBase: '/methane/styles',
  hydrationModuleUrl: '/assets/methane-sveltekit-hydrate.js',
}) as Handle;
