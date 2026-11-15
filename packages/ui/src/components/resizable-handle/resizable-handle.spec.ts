import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const resizableHandleSpec: ComponentBehaviorSpec = {
  tag: 'mth-resizable-handle',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['disabled', 'dragging'],
  keyboard: [
    { key: 'ArrowLeft', when: 'Horizontal handle is focused', expect: 'Emits negative inline resize delta' },
    { key: 'ArrowRight', when: 'Horizontal handle is focused', expect: 'Emits positive inline resize delta' },
    { key: 'ArrowUp', when: 'Vertical handle is focused', expect: 'Emits negative block resize delta' },
    { key: 'ArrowDown', when: 'Vertical handle is focused', expect: 'Emits positive block resize delta' },
    { key: 'Home', when: 'Handle is focused', expect: 'Requests collapsing/minimizing preceding panel' },
    { key: 'End', when: 'Handle is focused', expect: 'Requests maximizing preceding panel' },
  ],
  props: [
    { name: 'orientation', attr: 'orientation', type: "'horizontal' | 'vertical'", default: 'horizontal' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'step', attr: 'step', type: 'number', default: 5 },
    { name: 'valueNow', attr: 'value-now', type: 'number', default: 50 },
    { name: 'valueMin', attr: 'value-min', type: 'number', default: 0 },
    { name: 'valueMax', attr: 'value-max', type: 'number', default: 100 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-resize-delta',
      cancelable: false,
      detailType: "{ deltaPercent?: number; deltaPx?: number; edge?: 'min' | 'max'; source: 'keyboard' | 'pointer' }",
    },
  ],
  slots: [
    { name: '', description: 'Optional custom grip affordance.' },
  ],
  parts: [
    { name: 'base', description: 'Interactive WAI-ARIA `role="separator"` bar.' },
  ],
  messages: {
    label: 'Resize panel',
  },
};

export const CEM_METADATA = {
  description: 'Draggable and keyboard-accessible separator handle for `<mth-resizable-group>`.',
  propDescriptions: {
    orientation: 'Group layout axis (`horizontal` or `vertical`).',
    disabled: 'Disables drag and keyboard resizing.',
    step: 'Arrow key increment in percentage points.',
    valueNow: 'Current separator ARIA value.',
    valueMin: 'Minimum separator ARIA value.',
    valueMax: 'Maximum separator ARIA value.',
    label: 'Accessible `aria-label` for the separator.',
  },
  eventDescriptions: {
    'mth-resize-delta': 'Bubbles resize deltas to parent `<mth-resizable-group>`.',
  },
  cssProperties: [
    { name: '--mth-color-border', description: 'Resting separator hairline color.' },
    { name: '--mth-color-accent', description: 'Focused/hover separator highlight color.' },
  ],
};
