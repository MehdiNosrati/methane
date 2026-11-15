import { registerMthToggleButton } from './element.js';

export * from './element.js';

registerMthToggleButton();

declare global {
  interface HTMLElementTagNameMap {
    'mth-toggle-button': import('./toggle-button.js').MthToggleButton;
  }
}
