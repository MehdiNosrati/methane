import { registerMthIconButton } from './element.js';

export * from './element.js';

registerMthIconButton();

declare global {
  interface HTMLElementTagNameMap {
    'mth-icon-button': import('./icon-button.js').MthIconButton;
  }
}
