import { defineComponents } from '@methane-ui/core';
import { MthConditionalField } from './conditional-field.js';

export {
  MthConditionalField,
  type ConditionMode,
  type ConditionOperator,
  type ConditionPredicate,
} from './conditional-field.js';
export { conditionalFieldMessages } from './conditional-field.messages.js';
export { conditionalFieldSpec } from './conditional-field.spec.js';
export { conditionalFieldStyles } from './conditional-field.styles.js';

export function registerMthConditionalField(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-conditional-field': MthConditionalField },
  });
}
