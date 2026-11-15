import { defineComponents } from '@methane-ui/core';
import { MthFormWizard } from './form-wizard.js';

export { MthFormWizard, type StepValidator } from './form-wizard.js';
export { formWizardMessages } from './form-wizard.messages.js';
export { formWizardStyles } from './form-wizard.styles.js';

export function registerMthFormWizard(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-form-wizard': MthFormWizard },
  });
}
