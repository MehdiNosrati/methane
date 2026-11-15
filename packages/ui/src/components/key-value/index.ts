import { registerMthKeyValue } from './element.js';

export * from './element.js';

registerMthKeyValue();

declare global {
  interface HTMLElementTagNameMap {
    'mth-key-value': import('./key-value.js').MthKeyValue;
  }
}
