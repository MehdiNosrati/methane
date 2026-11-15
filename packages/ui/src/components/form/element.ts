import { defineComponents } from '@methane-ui/core';
import { MthForm } from './form.js';

export { MthForm, type FormValidationError, type FormValues } from './form.js';
export { formMessages } from './form.messages.js';
export { formSpec } from './form.spec.js';
export { formStyles } from './form.styles.js';

export function registerMthForm(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-form': MthForm },
  });
}
