import { registerMthFieldset } from './element.js';

export * from './element.js';

registerMthFieldset();

declare global {
  interface HTMLElementTagNameMap {
    'mth-fieldset': import('./fieldset.js').MthFieldset;
  }
}
