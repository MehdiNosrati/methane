import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const stopwatchSpec: ComponentBehaviorSpec = {
  tag: 'mth-stopwatch',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['running', 'disabled'],
  keyboard: [
    {
      key: 'Enter',
      when: 'Start/Pause, Lap, or Reset button is focused',
      expect: 'Activates the focused stopwatch control',
    },
  ],
  props: [
    { name: 'running', attr: 'running', type: 'boolean', default: false },
    { name: 'showMilliseconds', attr: 'show-milliseconds', type: 'boolean', default: true },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-start', cancelable: false, detailType: '{ elapsedMs: number }' },
    { name: 'mth-pause', cancelable: false, detailType: '{ elapsedMs: number }' },
    { name: 'mth-reset', cancelable: false, detailType: '{ elapsedMs: number }' },
    { name: 'mth-lap', cancelable: false, detailType: '{ index: number; lapMs: number; totalMs: number }' },
  ],
  slots: [
    { name: 'controls', description: 'Optional extra controls beside Start/Pause, Lap, and Reset.' },
  ],
  parts: [
    { name: 'base', description: 'Outer stopwatch container.' },
    { name: 'time', description: 'Semantic `<time>` elapsed readout with tabular numerals.' },
    { name: 'controls', description: 'Action button toolbar.' },
    { name: 'toggle', description: 'Start / Pause / Resume toggle button.' },
    { name: 'lap', description: 'Lap capture button.' },
    { name: 'reset', description: 'Reset button.' },
    { name: 'laps', description: 'Ordered list of recorded laps.' },
    { name: 'lap-item', description: 'Single lap entry item.' },
    { name: 'status', description: 'Polite live region announcing discrete transitions only.' },
  ],
  messages: {
    regionLabel: 'Stopwatch',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    lap: 'Lap',
    reset: 'Reset',
  },
};

export const CEM_METADATA = {
  description:
    'Interactive stopwatch with Start/Pause/Lap/Reset controls, tabular-numeral `<time>` display, clean interval teardown on disconnect, and discrete polite live-region announcements.',
  propDescriptions: {
    running: 'Indicates or controls whether the stopwatch is currently timing.',
    showMilliseconds: 'Displays centiseconds/milliseconds fraction when true.',
    disabled: 'Disables all stopwatch controls.',
  },
  eventDescriptions: {
    'mth-start': 'Emitted when timing begins or resumes.',
    'mth-pause': 'Emitted when timing pauses.',
    'mth-reset': 'Emitted when elapsed time and laps are cleared.',
    'mth-lap': 'Emitted when a lap split is recorded.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Stopwatch container background.' },
    { name: '--mth-color-border', description: 'Container and button border color.' },
    { name: '--mth-color-accent', description: 'Primary Start button accent background.' },
    { name: '--mth-color-accent-fg', description: 'Primary Start button text color.' },
  ],
};
