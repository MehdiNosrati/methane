import { registerMthConditionalField } from './element.js';

export * from './element.js';

registerMthConditionalField();

declare global {
  interface HTMLElementTagNameMap {
    'mth-conditional-field': import('./conditional-field.js').MthConditionalField;
  }
}
