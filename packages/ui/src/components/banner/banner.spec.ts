import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { bannerMessages } from './banner.messages.js';

export const bannerSpec: ComponentBehaviorSpec = {
  tag: 'mth-banner',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['dismissed', 'sticky'],
  keyboard: [],
  props: [
    { name: 'variant', attr: 'variant', type: "'info' | 'success' | 'warning' | 'danger' | 'neutral'", default: 'info' },
    { name: 'dismissible', attr: 'dismissible', type: 'boolean', default: false },
    { name: 'dismissed', attr: 'dismissed', type: 'boolean', default: false },
    { name: 'sticky', attr: 'sticky', type: 'boolean', default: false },
    { name: 'heading', attr: 'heading', type: 'string', default: '' },
  ],
  events: [{ name: 'mth-dismiss', cancelable: true, detailType: 'undefined' }],
  slots: [
    { name: '', description: 'Banner message body.' },
    { name: 'icon', description: 'Optional leading icon.' },
    { name: 'actions', description: 'Optional inline action links or buttons.' },
  ],
  parts: [
    { name: 'base', description: 'Full-width banner container.' },
    { name: 'icon', description: 'Leading icon slot wrapper.' },
    { name: 'content', description: 'Heading and body copy wrapper.' },
    { name: 'heading', description: 'Optional banner heading.' },
    { name: 'actions', description: 'Action controls wrapper.' },
    { name: 'close-button', description: 'Dismiss button when `dismissible` is true.' },
  ],
  messages: { ...bannerMessages },
};

export const CEM_METADATA = {
  description:
    'Full-width announcement and system notice banner supporting semantic variants, sticky positioning, inline actions, and cancelable dismissal.',
  propDescriptions: {
    variant: 'Visual tone (`info`, `success`, `warning`, `danger`, or `neutral`).',
    dismissible: 'Renders a close button to dismiss the banner.',
    dismissed: 'Hides the banner when true.',
    sticky: 'Pins the banner to the top edge via `position: sticky`.',
    heading: 'Optional short summary heading.',
  },
  eventDescriptions: {
    'mth-dismiss': 'Cancelable event fired before dismissing the banner.',
  },
  cssProperties: [
    { name: '--mth-color-info-subtle', description: 'Info variant background color' },
    { name: '--mth-color-success-subtle', description: 'Success variant background color' },
    { name: '--mth-color-warning-subtle', description: 'Warning variant background color' },
    { name: '--mth-color-danger-subtle', description: 'Danger variant background color' },
    { name: '--mth-color-bg-subtle', description: 'Neutral variant background color' },
    { name: '--mth-color-fg', description: 'Foreground text color' },
    { name: '--mth-color-border', description: 'Border color' },
  ],
};
