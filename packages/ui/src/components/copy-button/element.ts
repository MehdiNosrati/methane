import { defineComponents } from '@methane-ui/core';
import { MthCopyButton } from './copy-button.js';

export {
  MthCopyButton,
  type MthCopyButtonSize,
  type MthCopyButtonVariant,
} from './copy-button.js';
export { copyButtonMessages } from './copy-button.messages.js';
export { copyButtonStyles } from './copy-button.styles.js';

export function registerMthCopyButton(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-copy-button': MthCopyButton },
  });
}
