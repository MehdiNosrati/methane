import { registerMthRadio } from './element.js';

export * from './element.js';

registerMthRadio();

declare global {
  interface HTMLElementTagNameMap {
    'mth-radio': import('./radio.js').MthRadio;
  }
}
