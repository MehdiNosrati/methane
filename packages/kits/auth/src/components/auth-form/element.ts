import { defineComponents } from '@methane-ui/core';
import { registerMthAlert } from '@methane-ui/ui/alert/element.js';
import { registerMthButton } from '@methane-ui/ui/button/element.js';
import { MthAuthForm } from './auth-form.js';

export { MthAuthForm, type MthAuthFormMode } from './auth-form.js';
export { authFormMessages } from './auth-form.messages.js';
export { authFormStyles } from './auth-form.styles.js';

export function registerMthAuthForm(prefix?: string): ReadonlyArray<string> {
  registerMthAlert();
  registerMthButton();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-auth-form': MthAuthForm },
  });
}
