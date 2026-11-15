import { defineComponents } from '@methane/core';
import { registerMthAlert } from '@methane/ui/alert/element.js';
import { registerMthButton } from '@methane/ui/button/element.js';
import { MthAuthForm } from './auth-form.js';

export { MthAuthForm, type MthAuthFormMode } from './auth-form.js';
export { authFormMessages } from './auth-form.messages.js';
export { authFormSpec } from './auth-form.spec.js';
export { authFormStyles } from './auth-form.styles.js';

export function registerMthAuthForm(prefix?: string): ReadonlyArray<string> {
  registerMthAlert();
  registerMthButton();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-auth-form': MthAuthForm },
  });
}
