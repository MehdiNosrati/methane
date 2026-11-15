import { defineComponents } from '@methane-ui/core';
import { registerMthSpinner } from '@methane-ui/ui/spinner/element.js';
import { MthSsoButtons } from './sso-buttons.js';

export {
  MthSsoButtons,
  type MthSsoOrientation,
  type SsoProviderItem,
} from './sso-buttons.js';
export { ssoButtonsMessages } from './sso-buttons.messages.js';
export { ssoButtonsStyles } from './sso-buttons.styles.js';

export function registerMthSsoButtons(prefix?: string): ReadonlyArray<string> {
  registerMthSpinner();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-sso-buttons': MthSsoButtons },
  });
}
