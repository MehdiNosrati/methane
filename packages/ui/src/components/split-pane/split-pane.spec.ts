import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const splitPaneSpec: ComponentBehaviorSpec = {
  tag: 'mth-split-pane',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['disabled', 'dragging'],
  keyboard: [
    { key: 'ArrowLeft', when: 'Horizontal divider separator is focused', expect: 'Adjusts split ratio toward start (or end in RTL)' },
    { key: 'ArrowRight', when: 'Horizontal divider separator is focused', expect: 'Adjusts split ratio toward end (or start in RTL)' },
    { key: 'ArrowUp', when: 'Vertical divider separator is focused', expect: 'Decreases start pane ratio' },
    { key: 'ArrowDown', when: 'Vertical divider separator is focused', expect: 'Increases start pane ratio' },
    { key: 'Home', when: 'Divider separator is focused', expect: 'Sets ratio to minRatio' },
    { key: 'End', when: 'Divider separator is focused', expect: 'Sets ratio to maxRatio' },
  ],
  props: [
    { name: 'orientation', attr: 'orientation', type: "'horizontal' | 'vertical'", default: 'horizontal' },
    { name: 'ratio', attr: 'ratio', type: 'number', default: 50 },
    { name: 'minRatio', attr: 'min-ratio', type: 'number', default: 0 },
    { name: 'maxRatio', attr: 'max-ratio', type: 'number', default: 100 },
    { name: 'step', attr: 'step', type: 'number', default: 5 },
    { name: 'stepLarge', attr: 'step-large', type: 'number', default: 15 },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-resize', cancelable: false, detailType: '{ ratio: number }' },
  ],
  slots: [
    { name: 'start', description: 'Primary start pane content.' },
    { name: 'end', description: 'Secondary end pane content.' },
    { name: 'divider', description: 'Optional custom divider grip handle.' },
  ],
  parts: [
    { name: 'base', description: 'Two-pane CSS Grid split container.' },
    { name: 'start', description: 'Start pane region.' },
    { name: 'divider', description: 'Interactive WAI-ARIA separator handle.' },
    { name: 'end', description: 'End pane region.' },
  ],
  messages: {
    dividerLabel: 'Resize panes',
  },
};

export const CEM_METADATA = {
  description: 'Two-pane splitter with accessible `role="separator"` keyboard control, pointer-capture drag resizing, and CSP-safe adopted stylesheet layout.',
  propDescriptions: {
    orientation: 'Split axis (`horizontal` side-by-side or `vertical` stacked).',
    ratio: 'Start pane percentage from `minRatio` to `maxRatio`.',
    minRatio: 'Minimum allowed start pane percentage.',
    maxRatio: 'Maximum allowed start pane percentage.',
    step: 'Arrow key increment in percentage points.',
    stepLarge: 'PageUp/PageDown increment in percentage points.',
    disabled: 'Disables pointer and keyboard resizing.',
    label: 'Accessible `aria-label` for the divider separator.',
  },
  eventDescriptions: {
    'mth-resize': 'Fired whenever the split ratio changes via pointer or keyboard.',
  },
  cssProperties: [
    { name: '--mth-color-border', description: 'Default divider hairline color.' },
    { name: '--mth-color-accent', description: 'Hover/active divider highlight color.' },
  ],
};
