import { registerMthCopyButton } from './element.js';

export * from './element.js';

registerMthCopyButton();

declare global {
  interface HTMLElementTagNameMap {
    'mth-copy-button': import('./copy-button.js').MthCopyButton;
  }
}
