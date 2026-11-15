import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { spinnerMessages } from './spinner.messages.js';

export const spinnerSpec: ComponentBehaviorSpec = {
  tag: 'mth-spinner',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: [],
  keyboard: [],
  props: [
    {
      name: 'size',
      attr: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg'",
      default: 'md',
    },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [],
  slots: [],
  parts: [
    { name: 'base', description: 'Root status container with `role="status"` and accessible label.' },
    { name: 'indicator', description: 'Animated circular SVG spinner indicator.' },
  ],
  messages: { ...spinnerMessages },
};

export const CEM_METADATA = {
  description:
    'Accessible indeterminate loading spinner with localized `role="status"` label and `prefers-reduced-motion` support.',
  propDescriptions: {
    size: 'Spinner diameter preset (`xs | sm | md | lg`).',
    label: 'Accessible loading announcement; defaults to localized `"Loading"` when empty.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Active spinner arc color.' },
    { name: '--mth-color-border', description: 'Spinner background track color.' },
  ],
};
