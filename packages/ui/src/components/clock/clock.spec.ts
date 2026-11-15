import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const clockSpec: ComponentBehaviorSpec = {
  tag: 'mth-clock',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['live'],
  keyboard: [],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'timeZone', attr: 'time-zone', type: 'string', default: '' },
    { name: 'locale', attr: 'locale', type: 'string', default: '' },
    { name: 'variant', attr: 'variant', type: "'digital' | 'analog' | 'both'", default: 'both' },
    { name: 'hour12', attr: 'hour-12', type: 'boolean', default: false },
    { name: 'showSeconds', attr: 'show-seconds', type: 'boolean', default: true },
    { name: 'live', attr: 'live', type: 'boolean', default: true },
  ],
  events: [],
  slots: [
    { name: 'label', description: 'Optional caption rendered beside or above the clock.' },
  ],
  parts: [
    { name: 'base', description: 'Outer clock wrapper.' },
    { name: 'dial', description: 'Analog SVG clock face.' },
    { name: 'hand-hour', description: 'Analog hour hand.' },
    { name: 'hand-minute', description: 'Analog minute hand.' },
    { name: 'hand-second', description: 'Analog second hand.' },
    { name: 'time', description: 'Digital semantic `<time>` readout.' },
  ],
  messages: {
    regionLabel: 'Clock',
  },
};

export const CEM_METADATA = {
  description:
    'Localized digital and analog `<time>` clock component powered by `FormattingUtils` with optional `time-zone`, fixed SSR-safe `value` snapshot, and automatic interval teardown.',
  propDescriptions: {
    value: 'Optional fixed ISO-8601 timestamp or `HH:MM[:SS]` value (disables live clock ticking).',
    timeZone: 'Optional IANA time zone (e.g. `UTC`, `America/New_York`).',
    locale: 'BCP-47 locale override for localized digital time formatting.',
    variant: 'Presentation mode (`digital`, `analog`, or `both`).',
    hour12: 'Uses 12-hour cycle when true (`false` uses locale/24-hour formatting).',
    showSeconds: 'Displays seconds in digital readout and analog second hand.',
    live: 'Automatically updates once per second when connected and no `value` is set.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Dial background surface.' },
    { name: '--mth-color-border', description: 'Dial outer ring color.' },
    { name: '--mth-color-fg', description: 'Hour/minute hand and digital text color.' },
    { name: '--mth-color-accent', description: 'Second hand accent color.' },
  ],
};
