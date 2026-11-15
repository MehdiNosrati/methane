import { registerMthOptionGroup } from './element.js';

export * from './element.js';

registerMthOptionGroup();

declare global {
  interface HTMLElementTagNameMap {
    'mth-option-group': import('./option-group.js').MthOptionGroup;
  }
}
