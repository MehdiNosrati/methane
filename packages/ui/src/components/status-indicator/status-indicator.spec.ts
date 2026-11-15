import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { statusIndicatorMessages } from './status-indicator.messages.js';

export const statusIndicatorSpec: ComponentBehaviorSpec = {
  tag: 'mth-status-indicator',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['pulse'],
  keyboard: [],
  props: [
    {
      name: 'status',
      attr: 'status',
      type: "'online' | 'offline' | 'busy' | 'away' | 'error' | 'warning' | 'info' | 'neutral'",
      default: 'neutral',
    },
    { name: 'pulse', attr: 'pulse', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'size', attr: 'size', type: "'sm' | 'md' | 'lg'", default: 'md' },
  ],
  events: [],
  slots: [{ name: '', description: 'Optional status text overriding `label`.' }],
  parts: [
    { name: 'base', description: 'Inline indicator wrapper.' },
    { name: 'dot', description: 'Colored semantic status dot.' },
    { name: 'label', description: 'Status label text.' },
  ],
  messages: { ...statusIndicatorMessages },
};

export const CEM_METADATA = {
  description:
    'Semantic status dot and optional live label supporting presence (`online`, `offline`, `busy`, `away`) and system states (`error`, `warning`, `info`, `neutral`) with reduced-motion pulse.',
  propDescriptions: {
    status: 'Semantic presence or health state.',
    pulse: 'Enables a subtle ping animation when motion is allowed.',
    label: 'Optional visible status text.',
    size: 'Dot diameter size (`sm`, `md`, or `lg`).',
  },
  eventDescriptions: {},
  cssProperties: [
    { name: '--mth-color-success', description: 'Online status dot color' },
    { name: '--mth-color-danger', description: 'Busy/error status dot color' },
    { name: '--mth-color-warning', description: 'Away/warning status dot color' },
    { name: '--mth-color-info', description: 'Info status dot color' },
    { name: '--mth-color-fg-muted', description: 'Offline/neutral dot color' },
  ],
};
