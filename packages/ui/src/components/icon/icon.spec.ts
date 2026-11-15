import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { iconMessages } from './icon.messages.js';

export const iconSpec: ComponentBehaviorSpec = {
  tag: 'mth-icon',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: [],
  keyboard: [],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    {
      name: 'size',
      attr: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
      default: 'md',
    },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [],
  slots: [
    { name: '', description: 'Custom vector graphic fallback when `name` is omitted or unmapped.' },
  ],
  parts: [
    { name: 'base', description: 'Root icon wrapper (`aria-hidden="true"` or `role="img"`).' },
    { name: 'svg', description: 'Built-in semantic vector icon `<svg>` element.' },
  ],
  messages: { ...iconMessages },
};

export const CEM_METADATA = {
  description:
    'Semantic vector icon catalog rendered via Lit `svg` templates with accessible label/decorative modes and slot fallback.',
  propDescriptions: {
    name: 'Built-in icon identifier (`check`, `close`, `chevron-down`, `chevron-right`, `chevron-left`, `chevron-up`, `search`, `info`, `warning`, `error`, `success`, `external`, `menu`, `plus`, `minus`, `user`, `copy`, `share`).',
    size: 'Icon dimension preset (`xs | sm | md | lg | xl`).',
    label: 'Accessible label; renders `role="img"` with `aria-label` when provided, or `aria-hidden="true"` when decorative.',
  },
  cssProperties: [
    { name: '--mth-icon-size', description: 'Override icon inline and block size.' },
    { name: '--mth-icon-color', description: 'Override icon stroke/fill color.' },
  ],
};
