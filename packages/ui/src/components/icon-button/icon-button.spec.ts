import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const iconButtonSpec: ComponentBehaviorSpec = {
  tag: 'mth-icon-button',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['disabled', 'loading', 'pressed'],
  keyboard: [
    { key: 'Enter', when: 'Icon button is focused and enabled', expect: 'Emits mth-press and toggles pressed state when defined' },
    { key: ' ', when: 'Icon button is focused and enabled', expect: 'Emits mth-press and toggles pressed state when defined' },
  ],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'variant', attr: 'variant', type: "'solid' | 'outline' | 'ghost' | 'danger'", default: 'ghost' },
    { name: 'size', attr: 'size', type: "'sm' | 'md' | 'lg'", default: 'md' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'loading', attr: 'loading', type: 'boolean', default: false },
    { name: 'pressed', attr: 'pressed', type: 'boolean | undefined', default: undefined },
  ],
  events: [
    {
      name: 'mth-press',
      cancelable: true,
      detailType: '{ originalEvent: Event }',
    },
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ pressed: boolean }',
    },
  ],
  slots: [{ name: '', description: 'Icon graphic content.' }],
  parts: [
    { name: 'base', description: 'Root container.' },
    { name: 'control', description: 'Native internal button with accessible `aria-label`.' },
    { name: 'spinner', description: 'Loading indicator shown when `loading` is true.' },
  ],
  messages: {
    fallbackLabel: 'Icon button',
  },
};

export const CEM_METADATA = {
  description: 'Accessible icon-only action or toggle button requiring an explicit `label`.',
  propDescriptions: {
    label: 'Required accessible name forwarded to inner `aria-label`. Emits a dev warning if empty.',
    variant: 'Visual emphasis variant.',
    size: 'Square control size scale.',
    disabled: 'Disables interaction.',
    loading: 'Shows loading spinner and suppresses activation.',
    pressed: 'Optional toggle state (`true` | `false`); sets `aria-pressed` when defined.',
  },
  eventDescriptions: {
    'mth-press': 'Fired when activated while enabled and not loading.',
    'mth-change': 'Fired when a toggleable icon button (`pressed !== undefined`) changes state.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Solid variant background color.' },
    { name: '--mth-color-bg-subtle', description: 'Ghost hover background color.' },
    { name: '--mth-radius-md', description: 'Icon button corner radius.' },
  ],
};
