import { registerMthSpinner } from './element.js';

export * from './element.js';

registerMthSpinner();

declare global {
  interface HTMLElementTagNameMap {
    'mth-spinner': import('./spinner.js').MthSpinner;
  }
}
