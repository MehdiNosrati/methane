import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const countdownSpec: ComponentBehaviorSpec = {
  tag: 'mth-countdown',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['running', 'complete'],
  keyboard: [],
  props: [
    { name: 'target', attr: 'target', type: 'string', default: '' },
    { name: 'duration', attr: 'duration', type: 'number', default: 0 },
    { name: 'running', attr: 'running', type: 'boolean', default: true },
    { name: 'precision', attr: 'precision', type: "'seconds' | 'minutes'", default: 'seconds' },
    { name: 'format', attr: 'format', type: "'hms' | 'dhms'", default: 'dhms' },
    { name: 'announceInterval', attr: 'announce-interval', type: 'number', default: 30 },
  ],
  events: [
    {
      name: 'mth-tick',
      cancelable: false,
      detailType: '{ remainingMs: number; days: number; hours: number; minutes: number; seconds: number }',
    },
    {
      name: 'mth-complete',
      cancelable: false,
      detailType: '{ target: string }',
    },
  ],
  slots: [
    { name: 'prefix', description: 'Optional label rendered before the countdown.' },
    { name: 'complete', description: 'Optional content displayed once the countdown reaches zero.' },
  ],
  parts: [
    { name: 'base', description: 'Outer countdown container.' },
    { name: 'time', description: 'Semantic `<time>` duration readout.' },
    { name: 'segment', description: 'Individual unit group (days, hours, minutes, seconds).' },
    { name: 'value', description: 'Tabular-numeral digit block.' },
    { name: 'unit', description: 'Unit caption.' },
    { name: 'status', description: 'Throttled polite live region announcing completion and intervals.' },
  ],
  messages: {
    regionLabel: 'Countdown timer',
    daysLabel: 'days',
    hoursLabel: 'hours',
    minutesLabel: 'minutes',
    secondsLabel: 'seconds',
    completed: 'Countdown complete',
  },
};

export const CEM_METADATA = {
  description:
    'Live countdown timer using `<time datetime>` ISO-8601 duration markup, tabular numerals, idempotent timer lifecycle cleanup, and throttled polite live announcements.',
  propDescriptions: {
    target: 'Target ISO-8601 timestamp string to count down toward.',
    duration: 'Duration in seconds used when `target` is omitted.',
    running: 'Starts or pauses the active countdown interval.',
    precision: 'Smallest displayed time unit (`seconds` or `minutes`).',
    format: 'Display segmentation (`dhms` includes days; `hms` rolls days into hours).',
    announceInterval: 'Seconds between polite screen-reader announcements while running (`0` announces only completion).',
  },
  eventDescriptions: {
    'mth-tick': 'Emitted on each interval tick with remaining duration breakdown.',
    'mth-complete': 'Emitted once when remaining time reaches zero.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Segment card background.' },
    { name: '--mth-color-border', description: 'Segment card border.' },
    { name: '--mth-color-fg', description: 'Digit foreground color.' },
    { name: '--mth-color-fg-muted', description: 'Unit label foreground color.' },
  ],
};
