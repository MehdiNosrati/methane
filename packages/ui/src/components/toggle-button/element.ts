import { defineComponents } from '@methane/core';
import { MthToggleButton } from './toggle-button.js';

export {
  MthToggleButton,
  type MthToggleButtonSize,
  type MthToggleButtonVariant,
} from './toggle-button.js';
export { toggleButtonMessages } from './toggle-button.messages.js';
export { toggleButtonSpec } from './toggle-button.spec.js';
export { toggleButtonStyles } from './toggle-button.styles.js';

export function registerMthToggleButton(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-toggle-button': MthToggleButton },
  });
}
