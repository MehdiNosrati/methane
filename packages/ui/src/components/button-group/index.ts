import { registerMthButtonGroup } from './element.js';

export * from './element.js';

registerMthButtonGroup();

declare global {
  interface HTMLElementTagNameMap {
    'mth-button-group': import('./button-group.js').MthButtonGroup;
  }
}
