import { registerMthCheckbox } from './element.js';

export * from './element.js';

registerMthCheckbox();

declare global {
  interface HTMLElementTagNameMap {
    'mth-checkbox': import('./checkbox.js').MthCheckbox;
  }
}
