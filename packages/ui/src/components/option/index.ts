import { registerMthOption } from './element.js';

export * from './element.js';

registerMthOption();

declare global {
  interface HTMLElementTagNameMap {
    'mth-option': import('./option.js').MthOption;
  }
}
