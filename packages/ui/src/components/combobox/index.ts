import { registerMthCombobox } from './element.js';

export * from './element.js';

registerMthCombobox();

declare global {
  interface HTMLElementTagNameMap {
    'mth-combobox': import('./combobox.js').MthCombobox;
  }
}
