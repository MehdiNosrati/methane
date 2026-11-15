import { defineComponents } from '@methane/core';
import { MthButtonGroup } from './button-group.js';

export {
  MthButtonGroup,
  type MthButtonGroupOrientation,
  type MthButtonGroupRoleMode,
} from './button-group.js';
export { buttonGroupMessages } from './button-group.messages.js';
export { buttonGroupSpec } from './button-group.spec.js';
export { buttonGroupStyles } from './button-group.styles.js';

export function registerMthButtonGroup(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-button-group': MthButtonGroup },
  });
}
