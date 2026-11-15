import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { inlineStatusMessages } from './inline-status.messages.js';

export const inlineStatusSpec: ComponentBehaviorSpec = {
  tag: 'mth-inline-status',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['loading'],
  keyboard: [],
  props: [
    {
      name: 'variant',
      attr: 'variant',
      type: "'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'",
      default: 'neutral',
    },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'live', attr: 'live', type: "'polite' | 'assertive' | 'off'", default: 'polite' },
  ],
  events: [],
  slots: [
    { name: '', description: 'Inline status text overriding `label`.' },
    { name: 'icon', description: 'Optional custom indicator icon.' },
  ],
  parts: [
    { name: 'base', description: 'Inline status flex wrapper.' },
    { name: 'icon', description: 'Semantic icon or spinner.' },
    { name: 'label', description: 'Status message copy.' },
  ],
  messages: { ...inlineStatusMessages },
};

export const CEM_METADATA = {
  description:
    'Compact inline live-region status badge (`Saved`, `Saving...`, `Error`, `Warning`) with reduced-motion spinner and configurable ARIA politeness.',
  propDescriptions: {
    variant: 'Visual tone (`neutral`, `info`, `success`, `warning`, `danger`, or `loading`).',
    label: 'Default status message text when no slotted copy is supplied.',
    live: 'ARIA live region mode (`polite`, `assertive`, or `off`).',
  },
  eventDescriptions: {},
  cssProperties: [
    { name: '--mth-color-fg-muted', description: 'Neutral variant color' },
    { name: '--mth-color-info', description: 'Info/loading variant color' },
    { name: '--mth-color-success', description: 'Success variant color' },
    { name: '--mth-color-warning', description: 'Warning variant color' },
    { name: '--mth-color-danger', description: 'Danger variant color' },
  ],
};
