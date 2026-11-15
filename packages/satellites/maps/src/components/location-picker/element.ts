import { defineComponents } from '@methane-ui/core';
import { MthLocationPicker } from './location-picker.js';
import { locationPickerMessages } from './location-picker.messages.js';
import { locationPickerStyles } from './location-picker.styles.js';

export { MthLocationPicker, locationPickerMessages, locationPickerStyles };

export function registerMthLocationPicker(prefix?: string): string {
  return defineComponents({
    ...(prefix ? { prefix } : {}),
    components: { 'mth-location-picker': MthLocationPicker },
  })[0]!;
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-location-picker': MthLocationPicker;
  }
}
