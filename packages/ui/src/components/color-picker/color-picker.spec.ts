import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const colorPickerSpec: ComponentBehaviorSpec = {
  tag: 'mth-color-picker',
  package: '@methane/ui',
  conformance: ['form-control', 'overlay'],
  controllers: ['FormControlController', 'OverlayController', 'PositioningController'],
  focusModel: 'delegates-focus',
  states: ['open', 'disabled', 'readonly', 'dirty', 'touched', 'invalid'],
  keyboard: [
    { key: 'Enter', when: 'Trigger or swatch button is focused', expect: 'Toggles popover or selects color swatch' },
    { key: 'Escape', when: 'Color picker popover is open', expect: 'Closes popover and restores focus' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '#2563eb' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-open', cancelable: true, detailType: '{ open: true }' },
    { name: 'mth-after-open', cancelable: false, detailType: '{ open: true }' },
    { name: 'mth-close', cancelable: false, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: '{ reason: string }' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Root color picker container.' },
    { name: 'label', description: 'Optional field label.' },
    { name: 'control', description: 'Color preview, hex input, and toggle trigger row.' },
    { name: 'swatch-preview', description: 'Live preview swatch of the selected color.' },
    { name: 'input', description: 'Hex color text input.' },
    { name: 'trigger', description: 'Popover toggle button.' },
    { name: 'eyedropper', description: 'Feature-detected EyeDropper sample button.' },
    { name: 'popover', description: 'Floating HSL sliders and preset swatches surface.' },
    { name: 'sliders', description: 'Hue, saturation, and lightness range sliders.' },
    { name: 'swatches', description: 'Preset color swatch grid.' },
    { name: 'swatch', description: 'Individual preset color button.' },
  ],
  messages: {
    openPicker: 'Open color picker',
    hue: 'Hue',
    saturation: 'Saturation',
    lightness: 'Lightness',
    eyedropper: 'Pick color from screen',
    swatchesLabel: 'Color presets',
    invalidColor: 'Enter a valid hex color (e.g. #2563eb)',
  },
};

export const CEM_METADATA = {
  description: 'Form-associated color picker with HSL sliders, preset swatches, hex input, and feature-detected EyeDropper support.',
  propDescriptions: {
    value: 'Selected hex color string (e.g. `#2563eb`).',
    name: 'Form field name.',
    label: 'Accessible field label.',
    open: 'Whether the color picker popover is open.',
    disabled: 'Disables interaction.',
    readonly: 'Prevents changing the color value.',
    required: 'Marks a color selection as required.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when the selected color changes.',
    'mth-open': 'Cancelable event fired before opening.',
    'mth-after-open': 'Fired after opening completes.',
    'mth-close': 'Fired on close.',
    'mth-after-close': 'Fired after close completes.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Control background.' },
    { name: '--mth-color-surface-raised', description: 'Popover surface background.' },
    { name: '--mth-color-border', description: 'Border color.' },
  ],
};
