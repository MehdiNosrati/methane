import { defineComponents } from '@methane/core';
import { registerMthSpinner } from '@methane/ui/spinner/element.js';
import { MthSsoButtons } from './sso-buttons.js';

export {
  MthSsoButtons,
  type MthSsoOrientation,
  type SsoProviderItem,
} from './sso-buttons.js';
export { ssoButtonsMessages } from './sso-buttons.messages.js';
export { ssoButtonsSpec } from './sso-buttons.spec.js';
export { ssoButtonsStyles } from './sso-buttons.styles.js';

export function registerMthSsoButtons(prefix?: string): ReadonlyArray<string> {
  registerMthSpinner();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-sso-buttons': MthSsoButtons },
  });
}
