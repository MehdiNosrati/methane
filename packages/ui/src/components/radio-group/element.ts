import { defineComponents } from '@methane-ui/core';
import { MthRadioGroup } from './radio-group.js';

export { MthRadioGroup } from './radio-group.js';
export { radioGroupMessages } from './radio-group.messages.js';
export { radioGroupStyles } from './radio-group.styles.js';

export function registerMthRadioGroup(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-radio-group': MthRadioGroup },
  });
}
