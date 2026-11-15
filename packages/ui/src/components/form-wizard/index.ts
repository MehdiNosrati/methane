import { registerMthFormWizard } from './element.js';

export * from './element.js';

registerMthFormWizard();

declare global {
  interface HTMLElementTagNameMap {
    'mth-form-wizard': import('./form-wizard.js').MthFormWizard;
  }
}
