import { registerMthAuthForm } from './element.js';

export * from './element.js';

registerMthAuthForm();

declare global {
  interface HTMLElementTagNameMap {
    'mth-auth-form': import('./auth-form.js').MthAuthForm;
  }
}
