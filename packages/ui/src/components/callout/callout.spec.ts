import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { calloutMessages } from './callout.messages.js';

export const calloutSpec: ComponentBehaviorSpec = {
  tag: 'mth-callout',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['collapsed'],
  keyboard: [],
  props: [
    { name: 'variant', attr: 'variant', type: "'info' | 'note' | 'tip' | 'warning' | 'danger'", default: 'note' },
    { name: 'heading', attr: 'heading', type: 'string', default: '' },
    { name: 'collapsible', attr: 'collapsible', type: 'boolean', default: false },
    { name: 'open', attr: 'open', type: 'boolean', default: true },
  ],
  events: [{ name: 'mth-toggle', cancelable: false, detailType: '{ open: boolean }' }],
  slots: [
    { name: '', description: 'Callout body content.' },
    { name: 'icon', description: 'Optional leading icon.' },
    { name: 'actions', description: 'Optional footer or inline action links.' },
  ],
  parts: [
    { name: 'base', description: 'Callout card container.' },
    { name: 'header', description: 'Callout header row with icon, heading, and optional collapse toggle.' },
    { name: 'icon', description: 'Leading icon slot wrapper.' },
    { name: 'heading', description: 'Callout title.' },
    { name: 'toggle-button', description: 'Collapse/expand toggle when `collapsible` is true.' },
    { name: 'body', description: 'Callout content wrapper.' },
    { name: 'actions', description: 'Optional actions slot wrapper.' },
  ],
  messages: { ...calloutMessages },
};

export const CEM_METADATA = {
  description:
    'Editorial documentation callout block (`note`, `tip`, `info`, `warning`, `danger`) with optional collapsible body and semantic `role="note"`.',
  propDescriptions: {
    variant: 'Semantic variant (`note`, `tip`, `info`, `warning`, or `danger`).',
    heading: 'Optional heading overriding the default localized variant title.',
    collapsible: 'Enables a header button to expand/collapse the callout body.',
    open: 'Controls whether the callout body is expanded when `collapsible` is enabled.',
  },
  eventDescriptions: {
    'mth-toggle': 'Fired when the collapsible callout state toggles.',
  },
  cssProperties: [
    { name: '--mth-color-bg-subtle', description: 'Note variant surface background' },
    { name: '--mth-color-info-subtle', description: 'Info variant background' },
    { name: '--mth-color-success-subtle', description: 'Tip variant background' },
    { name: '--mth-color-warning-subtle', description: 'Warning variant background' },
    { name: '--mth-color-danger-subtle', description: 'Danger variant background' },
    { name: '--mth-color-fg', description: 'Foreground text color' },
    { name: '--mth-color-border', description: 'Border color' },
    { name: '--mth-radius-md', description: 'Callout corner radius' },
  ],
};
