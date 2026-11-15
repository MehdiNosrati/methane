import { registerMthSchemaForm } from './element.js';

export * from './element.js';

registerMthSchemaForm();

declare global {
  interface HTMLElementTagNameMap {
    'mth-schema-form': import('./schema-form.js').MthSchemaForm;
  }
}
