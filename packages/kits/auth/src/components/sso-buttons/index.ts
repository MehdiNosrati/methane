import { registerMthSsoButtons } from './element.js';

export * from './element.js';

registerMthSsoButtons();

declare global {
  interface HTMLElementTagNameMap {
    'mth-sso-buttons': import('./sso-buttons.js').MthSsoButtons;
  }
}
