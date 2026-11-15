import { defineComponents } from '@methane-ui/core';
import { MthToggleGroup } from './toggle-group.js';

export {
  MthToggleGroup,
  type ToggleGroupOption,
  type ToggleGroupOrientation,
  type ToggleGroupSize,
} from './toggle-group.js';
export { toggleGroupMessages } from './toggle-group.messages.js';
export { toggleGroupSpec } from './toggle-group.spec.js';
export { toggleGroupStyles } from './toggle-group.styles.js';

export function registerMthToggleGroup(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-toggle-group': MthToggleGroup },
  });
}
