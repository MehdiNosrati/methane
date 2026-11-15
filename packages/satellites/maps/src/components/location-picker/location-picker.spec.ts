import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { locationPickerMessages } from './location-picker.messages.js';

export const locationPickerSpec: ComponentBehaviorSpec = {
  tag: 'mth-location-picker',
  package: '@methane/maps',
  conformance: ['form-control', 'satellite'],
  controllers: ['FormControlController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'invalid', 'dirty', 'touched'],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'defaultValue', attr: 'default-value', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'step', attr: 'step', type: 'number', default: 0.01 },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readOnly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'input', cancelable: false, detailType: 'undefined' },
    { name: 'change', cancelable: false, detailType: 'undefined' },
    { name: 'mth-location-select', cancelable: false, detailType: '{ lat: number; lng: number; value: string }' },
  ],
  slots: [
    { name: 'fallback', description: 'Fallback content for SSR or non-WebGL environments.' },
  ],
  parts: [
    { name: 'base', description: 'Outer form field container.' },
    { name: 'label', description: 'Field label text.' },
    { name: 'canvas', description: 'MapLibre canvas host.' },
    { name: 'pin-target', description: 'Interactive keyboard coordinate selector.' },
    { name: 'readout', description: 'Coordinate readout display.' },
    { name: 'clear-button', description: 'Clears the selected location.' },
    { name: 'error', description: 'Validation error message.' },
  ],
  keyboard: [
    { key: 'ArrowLeft', dir: 'ltr', when: 'pin target focused', expect: 'Nudges longitude west' },
    { key: 'ArrowRight', dir: 'rtl', when: 'pin target focused', expect: 'Nudges longitude west in RTL' },
    { key: 'ArrowUp', when: 'pin target focused', expect: 'Nudges latitude north' },
    { key: 'ArrowDown', when: 'pin target focused', expect: 'Nudges latitude south' },
    { key: 'Delete', when: 'pin target focused', expect: 'Clears the selected coordinate' },
  ],
  messages: { ...locationPickerMessages },
};
