import { defineComponents } from '@methane/core';
import { MthCreatableSelect } from './creatable-select.js';

export { MthCreatableSelect, type CreatableSelectOption } from './creatable-select.js';
export {
  creatableSelectMessages,
  type CreatableSelectMessages,
} from './creatable-select.messages.js';
export { creatableSelectSpec } from './creatable-select.spec.js';
export { creatableSelectStyles } from './creatable-select.styles.js';

export function registerMthCreatableSelect(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-creatable-select': MthCreatableSelect },
  });
}
