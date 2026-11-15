import { defineComponents } from '@methane-ui/core';
import { MthButton } from './button.js';

export { MthButton, type MthButtonSize, type MthButtonType, type MthButtonVariant } from './button.js';
export { buttonMessages } from './button.messages.js';
export { buttonSpec } from './button.spec.js';
export { buttonStyles } from './button.styles.js';

export function registerMthButton(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-button': MthButton },
  });
}
