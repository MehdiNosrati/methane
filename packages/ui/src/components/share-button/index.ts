import { registerMthShareButton } from './element.js';

export * from './element.js';

registerMthShareButton();

declare global {
  interface HTMLElementTagNameMap {
    'mth-share-button': import('./share-button.js').MthShareButton;
  }
}
