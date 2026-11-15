import { defineComponents } from '@methane/core';
import { MthAvailabilityPicker } from './availability-picker.js';

export {
  MthAvailabilityPicker,
  type AvailabilityDay,
  type AvailabilitySchedule,
} from './availability-picker.js';
export { availabilityPickerMessages } from './availability-picker.messages.js';
export { availabilityPickerSpec } from './availability-picker.spec.js';
export { availabilityPickerStyles } from './availability-picker.styles.js';

export function registerMthAvailabilityPicker(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-availability-picker': MthAvailabilityPicker },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-availability-picker': MthAvailabilityPicker;
  }
}
