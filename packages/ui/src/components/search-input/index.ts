import { registerMthSearchInput } from './element.js';

export * from './element.js';

registerMthSearchInput();

declare global {
  interface HTMLElementTagNameMap {
    'mth-search-input': import('./search-input.js').MthSearchInput;
  }
}
