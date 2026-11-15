import { registerMthSplitButton } from './element.js';

export * from './element.js';

registerMthSplitButton();

declare global {
  interface HTMLElementTagNameMap {
    'mth-split-button': import('./split-button.js').MthSplitButton;
  }
}
