import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const toggleButtonSpec: ComponentBehaviorSpec = {
  tag: 'mth-toggle-button',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['pressed', 'disabled'],
  keyboard: [
    { key: 'Enter', when: 'Button is focused and enabled', expect: 'Toggles pressed state and emits mth-change' },
    { key: ' ', when: 'Button is focused and enabled', expect: 'Toggles pressed state and emits mth-change' },
  ],
  props: [
    { name: 'pressed', attr: 'pressed', type: 'boolean', default: false },
    {
      name: 'variant',
      attr: 'variant',
      type: "'solid' | 'soft' | 'outline' | 'outlined' | 'ghost'",
      default: 'outline',
    },
    { name: 'size', attr: 'size', type: "'sm' | 'md' | 'lg'", default: 'md' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-press', cancelable: true, detailType: '{ originalEvent: Event; pressed: boolean }' },
    { name: 'mth-change', cancelable: true, detailType: '{ pressed: boolean; value: string }' },
  ],
  slots: [
    { name: '', description: 'Toggle button content.' },
    { name: 'start', description: 'Leading icon or indicator.' },
    { name: 'end', description: 'Trailing icon or badge.' },
  ],
  parts: [
    { name: 'base', description: 'Native `<button>` element with `aria-pressed`.' },
  ],
  messages: {
    pressedState: 'Pressed',
  },
};

export const CEM_METADATA = {
  description: 'Two-state pressable toggle button exposing `aria-pressed` and `:state(pressed)`.',
  propDescriptions: {
    pressed: 'Whether the toggle button is currently pressed.',
    variant: 'Visual style (`solid`, `soft`, `outline` / `outlined`, or `ghost`).',
    size: 'Control size (`sm`, `md`, or `lg`).',
    disabled: 'Disables interaction and focus.',
    value: 'Optional associated value included in `mth-change`.',
    label: 'Optional accessible `aria-label` when using icon-only content.',
  },
  eventDescriptions: {
    'mth-press': 'Cancelable event fired when pressed before state toggle.',
    'mth-change': 'Cancelable event fired when `pressed` toggles.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Pressed background/accent color.' },
    { name: '--mth-color-accent-fg', description: 'Pressed foreground color.' },
    { name: '--mth-color-border', description: 'Outline border color.' },
  ],
};
