import { defineComponents } from '@methane/core';
import { MthCombobox } from './combobox.js';

export { MthCombobox, type ComboboxOption } from './combobox.js';
export { comboboxMessages } from './combobox.messages.js';
export { comboboxSpec } from './combobox.spec.js';
export { comboboxStyles } from './combobox.styles.js';

export function registerMthCombobox(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-combobox': MthCombobox },
  });
}
