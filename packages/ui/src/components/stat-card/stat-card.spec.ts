import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const statCardSpec: ComponentBehaviorSpec = {
  tag: 'mth-stat-card',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['trend-up', 'trend-down', 'trend-neutral'],
  keyboard: [],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'format', attr: 'format', type: "'none' | 'number' | 'compact' | 'currency' | 'percent'", default: 'none' },
    { name: 'currency', attr: 'currency', type: 'string', default: 'USD' },
    { name: 'delta', attr: 'delta', type: 'string', default: '' },
    { name: 'trend', attr: 'trend', type: "'neutral' | 'up' | 'down'", default: 'neutral' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'variant', attr: 'variant', type: "'elevated' | 'outlined' | 'subtle'", default: 'elevated' },
  ],
  events: [],
  slots: [
    { name: 'icon', description: 'Optional leading icon slot.' },
    { name: 'label', description: 'Metric label slot.' },
    { name: '', description: 'Metric value override slot.' },
    { name: 'delta', description: 'Delta or comparison badge slot.' },
    { name: 'sparkline', description: 'Optional inline visualization slot.' },
    { name: 'footer', description: 'Optional card footer slot.' },
  ],
  parts: [
    { name: 'base', description: 'Outer metric card container.' },
    { name: 'header', description: 'Header row with label and icon.' },
    { name: 'icon', description: 'Icon slot wrapper.' },
    { name: 'label', description: 'Metric label text.' },
    { name: 'value', description: 'Formatted primary metric value.' },
    { name: 'trend', description: 'Delta trend indicator pill.' },
    { name: 'hint', description: 'Secondary helper/period text.' },
    { name: 'sparkline', description: 'Visualization slot wrapper.' },
    { name: 'footer', description: 'Card footer slot wrapper.' },
  ],
  messages: {
    statLabel: 'Metric summary',
    trendUp: 'Increase',
    trendDown: 'Decrease',
    trendNeutral: 'No change',
  },
};

export const CEM_METADATA = {
  description: 'Dashboard KPI stat card with `FormattingUtils` locale-aware formatting, directional trend indicator, and sparkline/footer slots.',
  propDescriptions: {
    label: 'Metric title label.',
    value: 'Raw or numeric metric value string.',
    format: 'Optional `Intl` formatting preset (`none`, `number`, `compact`, `currency`, `percent`).',
    currency: 'ISO 4217 currency code used when `format="currency"`.',
    delta: 'Comparison delta string (e.g. `+12.4%`).',
    trend: 'Directional sentiment (`up`, `down`, `neutral`).',
    hint: 'Secondary comparison period or caption text.',
    variant: 'Card surface style (`elevated`, `outlined`, `subtle`).',
  },
  eventDescriptions: {},
  cssProperties: [
    { name: '--mth-color-surface', description: 'Card surface background.' },
    { name: '--mth-color-border', description: 'Card border color.' },
    { name: '--mth-radius-lg', description: 'Card corner radius.' },
  ],
};
