import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const sparklineSpec: ComponentBehaviorSpec = {
  tag: 'mth-sparkline',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['empty'],
  keyboard: [],
  props: [
    { name: 'values', attr: false, type: 'ReadonlyArray<number>' },
    { name: 'data', attr: 'data', type: 'string', default: '' },
    { name: 'type', attr: 'type', type: "'line' | 'area' | 'bar'", default: 'line' },
    { name: 'variant', attr: 'variant', type: "'accent' | 'success' | 'warning' | 'danger' | 'neutral'", default: 'accent' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'showPoints', attr: 'show-points', type: 'boolean', default: false },
    { name: 'min', attr: 'min', type: 'number | null', default: null },
    { name: 'max', attr: 'max', type: 'number | null', default: null },
  ],
  events: [],
  slots: [
    { name: '', description: 'Optional accessible caption or fallback summary content.' },
  ],
  parts: [
    { name: 'base', description: 'Outer sparkline container.' },
    { name: 'svg', description: 'Inline SVG chart element with `<title>` and `<desc>`.' },
    { name: 'line', description: 'Polyline stroke path for `line` and `area` modes.' },
    { name: 'area', description: 'Filled polygon under the curve in `area` mode.' },
    { name: 'bar', description: 'Individual bar rects in `bar` mode.' },
    { name: 'point', description: 'Point markers rendered when `showPoints` is true.' },
    { name: 'summary', description: 'Accessible summary fallback text.' },
  ],
  messages: {
    defaultLabel: 'Trend sparkline',
    emptySummary: 'No data points available',
    summaryTemplate: '{count} points, minimum {min}, maximum {max}, latest {latest}',
  },
};

export const CEM_METADATA = {
  description: 'Accessible inline SVG sparkline (`line`, `area`, and `bar`) with `<title>`, `<desc>`, and screen-reader numeric summary fallback.',
  propDescriptions: {
    values: 'Numeric series array to plot.',
    data: 'Comma- or whitespace-separated numeric values for declarative HTML/SSR usage.',
    type: 'Visualization mode (`line`, `area`, or `bar`).',
    variant: 'Semantic stroke/fill palette (`accent`, `success`, `warning`, `danger`, `neutral`).',
    label: 'Accessible chart title used in SVG `<title>`.',
    showPoints: 'Renders circular point markers on each data vertex.',
    min: 'Optional explicit lower bound for Y-axis scaling.',
    max: 'Optional explicit upper bound for Y-axis scaling.',
  },
  eventDescriptions: {},
  cssProperties: [
    { name: '--mth-color-accent', description: 'Default sparkline stroke and fill base color.' },
    { name: '--mth-space-2', description: 'Padding/gap spacing.' },
  ],
};
