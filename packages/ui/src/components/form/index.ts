import { registerMthForm } from './element.js';

export * from './element.js';

registerMthForm();

declare global {
  interface HTMLElementTagNameMap {
    'mth-form': import('./form.js').MthForm;
  }
}
