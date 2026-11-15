import { registerUtilityElements } from '@methane-ui/primitives';
import { createMethaneHandle } from '@methane-ui/ssr-sveltekit';
import { registerAllComponents } from '@methane-ui/ui';
import type { Handle } from '@sveltejs/kit';

registerUtilityElements();
registerAllComponents();

export const handle: Handle = createMethaneHandle({
  styles: 'inline',
}) as Handle;
