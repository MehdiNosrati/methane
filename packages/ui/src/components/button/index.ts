import { registerMthButton } from './element.js';

export * from './element.js';

registerMthButton();

declare global {
  interface HTMLElementTagNameMap {
    'mth-button': import('./button.js').MthButton;
  }
}
