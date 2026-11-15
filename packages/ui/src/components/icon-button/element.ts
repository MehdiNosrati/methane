import { defineComponents } from '@methane/core';
import { MthIconButton } from './icon-button.js';

export {
  MthIconButton,
  type MthIconButtonSize,
  type MthIconButtonVariant,
} from './icon-button.js';
export { iconButtonMessages } from './icon-button.messages.js';
export { iconButtonSpec } from './icon-button.spec.js';
export { iconButtonStyles } from './icon-button.styles.js';

export function registerMthIconButton(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-icon-button': MthIconButton },
  });
}
