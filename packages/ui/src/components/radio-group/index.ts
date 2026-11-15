import { registerMthRadioGroup } from './element.js';

export * from './element.js';

registerMthRadioGroup();

declare global {
  interface HTMLElementTagNameMap {
    'mth-radio-group': import('./radio-group.js').MthRadioGroup;
  }
}
