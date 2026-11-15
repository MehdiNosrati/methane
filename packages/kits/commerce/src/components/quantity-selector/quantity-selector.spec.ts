import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { quantitySelectorMessages } from './quantity-selector.messages.js';

export const quantitySelectorSpec: ComponentBehaviorSpec = {
  tag: 'mth-quantity-selector',
  package: '@methane-ui/commerce',
  conformance: ['form-control'],
  controllers: ['FormControlController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'min', 'max'],
  keyboard: [
    { key: 'ArrowUp', when: 'spinbutton focused', expect: 'Increment quantity by step.' },
    { key: 'ArrowDown', when: 'spinbutton focused', expect: 'Decrement quantity by step.' },
    { key: 'PageUp', when: 'spinbutton focused', expect: 'Increment quantity by 10x step.' },
    { key: 'PageDown', when: 'spinbutton focused', expect: 'Decrement quantity by 10x step.' },
    { key: 'Home', when: 'spinbutton focused', expect: 'Jump to minimum quantity.' },
    { key: 'End', when: 'spinbutton focused', expect: 'Jump to maximum quantity.' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'number', default: 1 },
    { name: 'min', attr: 'min', type: 'number', default: 1 },
    { name: 'max', attr: 'max', type: 'number', default: 99 },
    { name: 'step', attr: 'step', type: 'number', default: 1 },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: number }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: number }' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Outer stepper group container.' },
    { name: 'decrement', description: 'Decrease quantity button.' },
    { name: 'input', description: 'Numeric spinbutton input.' },
    { name: 'increment', description: 'Increase quantity button.' },
  ],
  messages: { ...quantitySelectorMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated accessible quantity stepper with min/max/step clamping, spinbutton keyboard navigation, and FACE support.',
  propDescriptions: {
    value: 'Current numeric quantity value.',
    min: 'Minimum allowed quantity.',
    max: 'Maximum allowed quantity.',
    step: 'Step increment applied on stepper button or arrow key actions.',
    name: 'Form field name submitted via FormData.',
    label: 'Accessible group label overriding localized default.',
    disabled: 'Disables decrement, input, and increment controls.',
    required: 'Marks field required during form constraint validation.',
  },
  cssProperties: [
    { name: '--mth-color-border', description: 'Stepper border color.' },
    { name: '--mth-color-surface', description: 'Stepper background color.' },
    { name: '--mth-color-fg', description: 'Value text color.' },
  ],
};
