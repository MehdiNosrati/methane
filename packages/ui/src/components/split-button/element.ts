import { defineComponents } from '@methane-ui/core';
import { MthSplitButton } from './split-button.js';

export {
  MthSplitButton,
  type MthSplitButtonItem,
  type MthSplitButtonSize,
  type MthSplitButtonVariant,
} from './split-button.js';
export { splitButtonMessages } from './split-button.messages.js';
export { splitButtonSpec } from './split-button.spec.js';
export { splitButtonStyles } from './split-button.styles.js';

export function registerMthSplitButton(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-split-button': MthSplitButton },
  });
}
