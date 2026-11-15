import { defineComponents } from '@methane-ui/core';
import { MthCommandPalette } from './command-palette.js';

export { MthCommandPalette, type CommandPaletteItem } from './command-palette.js';
export { commandPaletteMessages } from './command-palette.messages.js';
export { commandPaletteSpec } from './command-palette.spec.js';
export { commandPaletteStyles } from './command-palette.styles.js';

export function registerMthCommandPalette(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-command-palette': MthCommandPalette },
  });
}
