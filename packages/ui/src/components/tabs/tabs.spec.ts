import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const tabsSpec: ComponentBehaviorSpec = {
  tag: 'mth-tabs',
  package: '@methane-ui/ui',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController', 'SelectionController', 'SlotCollectionController'],
  focusModel: 'none',
  role: 'tablist',
  states: ['vertical'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'Horizontal tablist has focus', expect: 'Moves focus to next enabled tab (and selects in automatic mode)' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'Horizontal tablist has focus in RTL', expect: 'Moves focus to next enabled tab (and selects in automatic mode)' },
    { key: 'ArrowDown', when: 'Vertical tablist has focus', expect: 'Moves focus to next enabled tab' },
    { key: 'ArrowUp', when: 'Vertical tablist has focus', expect: 'Moves focus to previous enabled tab' },
    { key: 'Home', when: 'Any tab has focus', expect: 'Moves focus to first enabled tab' },
    { key: 'End', when: 'Any tab has focus', expect: 'Moves focus to last enabled tab' },
    { key: 'Enter', when: 'Tab is focused in manual activation mode', expect: 'Selects focused tab and emits mth-change' },
    { key: ' ', when: 'Tab is focused in manual activation mode', expect: 'Selects focused tab and emits mth-change' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'activation', attr: 'activation', type: "'automatic' | 'manual'", default: 'automatic' },
    { name: 'orientation', attr: 'orientation', type: "'horizontal' | 'vertical'", default: 'horizontal' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ value: string }',
    },
  ],
  slots: [
    { name: 'tab', description: 'Slotted `<mth-tab>` triggers inside the tablist.' },
    { name: '', description: 'Slotted `<mth-tab-panel>` content regions.' },
  ],
  parts: [
    { name: 'base', description: 'Outer tabs layout container.' },
    { name: 'tablist', description: 'Internal `role="tablist"` container.' },
    { name: 'panels', description: 'Container holding slotted tab panels.' },
  ],
  messages: {
    tablistLabel: 'Tabs',
  },
};

export const CEM_METADATA = {
  description: 'Accessible APG tabbed interface with RTL-aware roving focus, automatic/manual activation, and same-root ARIA linkage.',
  propDescriptions: {
    value: 'Currently selected tab `value`.',
    activation: 'Whether arrow-key focus immediately selects tabs (`automatic`) or requires Enter/Space (`manual`).',
    orientation: 'Axis of tablist layout and arrow navigation (`horizontal` or `vertical`).',
    label: 'Accessible label for the internal `tablist` landmark.',
  },
  eventDescriptions: {
    'mth-change': 'Emitted when the selected tab value changes.',
  },
  cssProperties: [
    { name: '--mth-color-border', description: 'Tablist divider border color.' },
    { name: '--mth-space-2', description: 'Gap between tabs.' },
  ],
};
