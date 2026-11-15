import { defineComponents } from '@methane-ui/core';
import { MthAlert } from './alert.js';

export { MthAlert, type MthAlertVariant } from './alert.js';
export { alertMessages } from './alert.messages.js';
export { alertSpec } from './alert.spec.js';
export { alertStyles } from './alert.styles.js';

export function registerMthAlert(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-alert': MthAlert },
  });
}
