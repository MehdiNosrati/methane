import { defineComponents } from '@methane-ui/core';
import { MthToast } from './toast.js';

export {
  MthToast,
  type MthToastNotifyOptions,
  type MthToastPlacement,
  type MthToastVariant,
} from './toast.js';
export { toastMessages } from './toast.messages.js';
export { toastSpec } from './toast.spec.js';
export { toastStyles } from './toast.styles.js';

export function registerMthToast(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-toast': MthToast },
  });
}
