import { registerMthAlert } from './element.js';

export * from './element.js';

registerMthAlert();

declare global {
  interface HTMLElementTagNameMap {
    'mth-alert': import('./alert.js').MthAlert;
  }
}
