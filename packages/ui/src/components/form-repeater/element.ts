import { defineComponents } from '@methane/core';
import { MthFormRepeater } from './form-repeater.js';

export {
  MthFormRepeater,
  type RepeaterFieldSchema,
  type RepeaterRow,
} from './form-repeater.js';
export { formRepeaterMessages } from './form-repeater.messages.js';
export { formRepeaterSpec } from './form-repeater.spec.js';
export { formRepeaterStyles } from './form-repeater.styles.js';

export function registerMthFormRepeater(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-form-repeater': MthFormRepeater },
  });
}
