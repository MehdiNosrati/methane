import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { networkStatusMessages } from './network-status.messages.js';

export const networkStatusSpec: ComponentBehaviorSpec = {
  tag: 'mth-network-status',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['online', 'offline'],
  keyboard: [],
  props: [
    { name: 'online', attr: 'online', type: 'boolean', default: true },
    { name: 'showWhenOnline', attr: 'show-when-online', type: 'boolean', default: false },
    { name: 'offlineLabel', attr: 'offline-label', type: 'string', default: '' },
    { name: 'onlineLabel', attr: 'online-label', type: 'string', default: '' },
    { name: 'retryable', attr: 'retryable', type: 'boolean', default: true },
  ],
  events: [
    { name: 'mth-status-change', cancelable: false, detailType: '{ online: boolean }' },
    { name: 'mth-retry', cancelable: false, detailType: 'undefined' },
  ],
  slots: [
    { name: '', description: 'Custom offline/online notice copy.' },
    { name: 'actions', description: 'Optional extra action controls.' },
  ],
  parts: [
    { name: 'base', description: 'Network status banner container.' },
    { name: 'dot', description: 'Online/offline indicator dot.' },
    { name: 'message', description: 'Status message copy.' },
    { name: 'retry-button', description: 'Manual retry action button.' },
  ],
  messages: { ...networkStatusMessages },
};

export const CEM_METADATA = {
  description:
    'Reactive network connectivity indicator subscribing idempotently to browser `online`/`offline` events with live-region announcements and retry action.',
  propDescriptions: {
    online: 'Current connectivity state (true when online).',
    showWhenOnline: 'Keeps the indicator rendered even while `online` is true.',
    offlineLabel: 'Custom message shown when offline.',
    onlineLabel: 'Custom message shown when back online.',
    retryable: 'Shows a retry button while offline.',
  },
  eventDescriptions: {
    'mth-status-change': 'Fired when connectivity transitions between online and offline.',
    'mth-retry': 'Fired when the user triggers a manual retry check.',
  },
  cssProperties: [
    { name: '--mth-color-warning-subtle', description: 'Offline banner background color' },
    { name: '--mth-color-success-subtle', description: 'Online banner background color' },
    { name: '--mth-color-warning', description: 'Offline accent dot color' },
    { name: '--mth-color-success', description: 'Online accent dot color' },
    { name: '--mth-color-fg', description: 'Foreground text color' },
    { name: '--mth-color-border', description: 'Border color' },
  ],
};
