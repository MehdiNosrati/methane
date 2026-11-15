import { defineComponents } from '@methane/core';
import { MthEmptyState } from './empty-state.js';

export {
  MthEmptyState,
  type MthEmptyStateAlign,
  type MthEmptyStateRoleMode,
  type MthEmptyStateTone,
  type MthEmptyStateVariant,
} from './empty-state.js';
export { emptyStateMessages } from './empty-state.messages.js';
export { emptyStateSpec } from './empty-state.spec.js';
export { emptyStateStyles } from './empty-state.styles.js';

export function registerMthEmptyState(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-empty-state': MthEmptyState },
  });
}
