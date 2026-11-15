import { registerUtilityElements } from '@methane/primitives';
import { createMethaneHandle } from '@methane/ssr-sveltekit';
import { registerAllComponents } from '@methane/ui';
import type { Handle } from '@sveltejs/kit';

registerUtilityElements();
registerAllComponents();

export const handle: Handle = createMethaneHandle({
  styles: 'inline',
}) as Handle;
