import { registerMthCommandPalette } from './element.js';

export * from './element.js';

registerMthCommandPalette();

declare global {
  interface HTMLElementTagNameMap {
    'mth-command-palette': import('./command-palette.js').MthCommandPalette;
  }
}
