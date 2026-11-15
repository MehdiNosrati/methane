import { defineComponents } from '@methane/core';
import { MthColumnChooser } from './column-chooser.js';

export { MthColumnChooser, type ColumnChooserItem } from './column-chooser.js';
export { columnChooserMessages } from './column-chooser.messages.js';
export { columnChooserSpec } from './column-chooser.spec.js';
export { columnChooserStyles } from './column-chooser.styles.js';

export function registerMthColumnChooser(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-column-chooser': MthColumnChooser },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-column-chooser': MthColumnChooser;
  }
}
