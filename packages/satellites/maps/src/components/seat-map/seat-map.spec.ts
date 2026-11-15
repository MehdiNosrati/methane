import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { seatMapMessages } from './seat-map.messages.js';

export const seatMapSpec: ComponentBehaviorSpec = {
  tag: 'mth-seat-map',
  package: '@methane-ui/maps',
  conformance: ['form-control', 'roving-focus', 'satellite'],
  controllers: ['FormControlController', 'SelectionController', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'invalid', 'dirty', 'touched', 'multiple'],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'defaultValue', attr: 'default-value', type: 'string', default: '' },
    { name: 'seats', attr: false, type: 'ReadonlyArray<SeatDefinition>' },
    { name: 'columns', attr: 'columns', type: 'number', default: 4 },
    { name: 'multiple', attr: 'multiple', type: 'boolean', default: true },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readOnly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'input', cancelable: false, detailType: 'undefined' },
    { name: 'change', cancelable: false, detailType: 'undefined' },
    { name: 'mth-seat-select', cancelable: false, detailType: '{ selectedIds: ReadonlyArray<string>; seat: SeatDefinition }' },
  ],
  slots: [
    { name: 'fallback', description: 'Fallback content for SSR or non-WebGL environments.' },
  ],
  parts: [
    { name: 'base', description: 'Outer form control container.' },
    { name: 'label', description: 'Field label.' },
    { name: 'stage', description: 'Venue stage / front orientation indicator.' },
    { name: 'grid', description: '2D roving ARIA seat grid.' },
    { name: 'seat', description: 'Individual seat gridcell button.' },
    { name: 'legend', description: 'Seat status and tier legend.' },
    { name: 'error', description: 'Validation error message.' },
  ],
  keyboard: [
    { key: 'ArrowLeft', dir: 'ltr', when: 'seat gridcell focused', expect: 'Moves focus left by 1 seat' },
    { key: 'ArrowRight', dir: 'ltr', when: 'seat gridcell focused', expect: 'Moves focus right by 1 seat' },
    { key: 'ArrowUp', when: 'seat gridcell focused', expect: 'Moves focus up by 1 row' },
    { key: 'ArrowDown', when: 'seat gridcell focused', expect: 'Moves focus down by 1 row' },
    { key: 'Enter', when: 'seat gridcell focused', expect: 'Toggles or selects focused available seat' },
  ],
  messages: { ...seatMapMessages },
};

export const CEM_METADATA = {
  description: 'Form-associated 2D ARIA grid seat picker supporting multi-select, seat tiers, and validation.',
  propDescriptions: {
    name: 'Form field name.',
    value: 'Comma-separated selected seat identifiers.',
    defaultValue: 'Default reset seat value.',
    seats: 'Array of `SeatDefinition` entries.',
    columns: 'Number of grid columns used for row layout.',
    multiple: 'Allows selecting multiple seats.',
    required: 'Requires at least one selected seat.',
    disabled: 'Disables interaction and submission.',
    readOnly: 'Prevents changing seat selection.',
    label: 'Accessible field label.',
  },
  eventDescriptions: {
    input: 'Native composed event fired when selection changes.',
    change: 'Native composed event fired when selection commits.',
    'mth-seat-select': 'Fired when an available seat is toggled.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Seat map surface background.' },
    { name: '--mth-color-accent', description: 'Selected seat accent background.' },
    { name: '--mth-color-danger', description: 'Validation error color.' },
    { name: '--mth-color-border-focus', description: 'Focus-visible outline color.' },
  ],
};
