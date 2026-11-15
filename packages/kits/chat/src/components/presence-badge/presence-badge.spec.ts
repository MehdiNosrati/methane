import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { presenceBadgeMessages } from './presence-badge.messages.js';

export const presenceBadgeSpec: ComponentBehaviorSpec = {
  tag: 'mth-presence-badge',
  package: '@methane/chat',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['online', 'away', 'busy', 'offline'],
  keyboard: [],
  props: [
    {
      name: 'status',
      attr: 'status',
      type: "'online' | 'away' | 'busy' | 'offline'",
      default: 'offline',
    },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'showLabel', attr: 'show-label', type: 'boolean', default: true },
    { name: 'size', attr: 'size', type: "'sm' | 'md'", default: 'md' },
  ],
  events: [],
  slots: [{ name: '', description: 'Optional custom status text overriding localized status.' }],
  parts: [
    { name: 'base', description: 'Root presence badge wrapper.' },
    { name: 'indicator', description: 'Geometric SVG status marker.' },
    { name: 'label', description: 'Visible localized status label.' },
  ],
  messages: { ...presenceBadgeMessages },
};

export const CEM_METADATA = {
  description:
    'Accessible user presence indicator with shape-differentiated SVG markers for forced-colors safety.',
  propDescriptions: {
    status: 'Presence availability state (`online`, `away`, `busy`, or `offline`).',
    label: 'Optional accessible/visible status override text.',
    showLabel: 'Displays the localized status label beside the indicator.',
    size: 'Badge sizing token (`sm` or `md`).',
  },
  cssProperties: [
    { name: '--mth-color-success', description: 'Online presence indicator color.' },
    { name: '--mth-color-warning', description: 'Away presence indicator color.' },
    { name: '--mth-color-danger', description: 'Busy presence indicator color.' },
    { name: '--mth-color-fg-subtle', description: 'Offline presence indicator color.' },
  ],
};
