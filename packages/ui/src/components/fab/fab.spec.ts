import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const fabSpec: ComponentBehaviorSpec = {
  tag: 'mth-fab',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['disabled', 'extended'],
  keyboard: [
    { key: 'Enter', when: 'FAB is focused and enabled', expect: 'Emits mth-press' },
    { key: ' ', when: 'FAB is focused and enabled', expect: 'Emits mth-press' },
  ],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'variant', attr: 'variant', type: "'primary' | 'surface' | 'secondary'", default: 'primary' },
    { name: 'size', attr: 'size', type: "'sm' | 'md' | 'lg'", default: 'md' },
    { name: 'extended', attr: 'extended', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'fixed', attr: 'fixed', type: 'boolean', default: false },
    {
      name: 'placement',
      attr: 'placement',
      type: "'bottom-end' | 'bottom-start' | 'top-end' | 'top-start'",
      default: 'bottom-end',
    },
  ],
  events: [
    { name: 'mth-press', cancelable: true, detailType: '{ originalEvent: Event }' },
  ],
  slots: [
    { name: 'icon', description: 'Primary floating action icon.' },
    { name: '', description: 'Extended text label content when `extended` is true.' },
  ],
  parts: [
    { name: 'base', description: 'Native `<button>` floating action trigger.' },
    { name: 'icon', description: 'Icon wrapper span.' },
    { name: 'label', description: 'Visible label wrapper when extended.' },
  ],
  messages: {
    missingLabel: 'Action',
  },
};

export const CEM_METADATA = {
  description: 'Floating Action Button supporting compact circular, extended pill, and logical viewport corner placement.',
  propDescriptions: {
    label: 'Accessible label (`aria-label` when icon-only, fallback text when extended).',
    variant: 'Visual treatment (`primary`, `surface`, or `secondary`).',
    size: 'Dimension scale (`sm`, `md`, or `lg`).',
    extended: 'Displays text label alongside the icon.',
    disabled: 'Disables interaction.',
    fixed: 'Pins the FAB to a logical viewport corner using `placement`.',
    placement: 'Logical corner placement when `fixed` is enabled.',
  },
  eventDescriptions: {
    'mth-press': 'Cancelable event fired when the FAB is activated.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Primary FAB background color.' },
    { name: '--mth-shadow-lg', description: 'Elevated floating shadow.' },
    { name: '--mth-z-index-sticky', description: 'Stacking layer when `fixed` is set.' },
  ],
};
