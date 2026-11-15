import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const buttonGroupSpec: ComponentBehaviorSpec = {
  tag: 'mth-button-group',
  package: '@methane-ui/ui',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController', 'SlotCollectionController'],
  focusModel: 'none',
  role: 'group',
  states: ['attached', 'vertical', 'roving'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'Horizontal roving/toolbar mode is active', expect: 'Moves focus to the next enabled button' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'Horizontal roving/toolbar mode is active in RTL', expect: 'Moves focus to the next enabled button' },
    { key: 'ArrowDown', when: 'Vertical roving/toolbar mode is active', expect: 'Moves focus to the next enabled button' },
    { key: 'ArrowUp', when: 'Vertical roving/toolbar mode is active', expect: 'Moves focus to the previous enabled button' },
    { key: 'Home', when: 'Roving/toolbar mode is active', expect: 'Moves focus to the first enabled button' },
    { key: 'End', when: 'Roving/toolbar mode is active', expect: 'Moves focus to the last enabled button' },
  ],
  props: [
    { name: 'orientation', attr: 'orientation', type: "'horizontal' | 'vertical'", default: 'horizontal' },
    { name: 'attached', attr: 'attached', type: 'boolean', default: false },
    { name: 'roving', attr: 'roving', type: 'boolean', default: false },
    { name: 'roleMode', attr: 'role-mode', type: "'group' | 'toolbar'", default: 'group' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [],
  slots: [{ name: '', description: 'Grouped button elements (`<mth-button>`, `<mth-icon-button>`, or `<button>`).' }],
  parts: [{ name: 'base', description: 'Flex group container arranging slotted buttons.' }],
  messages: {},
};

export const CEM_METADATA = {
  description: 'Groups related buttons or icon buttons with optional attached styling and toolbar roving focus.',
  propDescriptions: {
    orientation: 'Layout and arrow-key navigation axis (`horizontal` or `vertical`).',
    attached: 'Visually joins adjacent buttons along the group axis.',
    roving: 'Enables single-tabstop APG roving focus navigation across slotted buttons.',
    roleMode: 'Semantic host role (`group` or `toolbar`). Setting `toolbar` automatically enables roving focus.',
    label: 'Accessible `aria-label` exposed via ElementInternals.',
  },
  cssProperties: [
    { name: '--mth-space-2', description: 'Gap between unattached buttons.' },
  ],
};
