import { registerMthFormRepeater } from './element.js';

export * from './element.js';

registerMthFormRepeater();

declare global {
  interface HTMLElementTagNameMap {
    'mth-form-repeater': import('./form-repeater.js').MthFormRepeater;
  }
}
