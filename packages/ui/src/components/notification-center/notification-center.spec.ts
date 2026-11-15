import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { notificationCenterMessages } from './notification-center.messages.js';

export const notificationCenterSpec: ComponentBehaviorSpec = {
  tag: 'mth-notification-center',
  package: '@methane/ui',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'NotificationStoreController'],
  focusModel: 'none',
  states: ['open', 'empty'],
  keyboard: [{ key: 'Escape', when: 'open', expect: 'Closes the notification center panel.' }],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'inline', attr: 'inline', type: 'boolean', default: false },
    { name: 'heading', attr: 'heading', type: 'string', default: '' },
    { name: 'maxItems', attr: 'max-items', type: 'number', default: 20 },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'undefined' },
    { name: 'mth-after-open', cancelable: false, detailType: 'undefined' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: 'undefined' },
    { name: 'mth-dismiss', cancelable: false, detailType: '{ id: string }' },
    { name: 'mth-clear', cancelable: false, detailType: 'undefined' },
  ],
  slots: [
    { name: 'empty', description: 'Optional custom empty-state content.' },
    { name: 'actions', description: 'Optional header actions beside Clear all.' },
  ],
  parts: [
    { name: 'base', description: 'Notification center surface.' },
    { name: 'header', description: 'Header row with heading, unread badge, and actions.' },
    { name: 'heading', description: 'Panel title.' },
    { name: 'badge', description: 'Active notification count pill.' },
    { name: 'clear-button', description: 'Button clearing all active notifications.' },
    { name: 'close-button', description: 'Button closing the notification drawer when overlaid.' },
    { name: 'list', description: 'Scrollable list of notifications.' },
    { name: 'item', description: 'Single notification card.' },
    { name: 'dismiss-button', description: 'Button dismissing a single notification.' },
    { name: 'empty', description: 'Empty-state container.' },
  ],
  messages: { ...notificationCenterMessages },
};

export const CEM_METADATA = {
  description:
    'Runtime-scoped notification tray and inbox subscribing to `getRuntime().notifications` via `NotificationStoreController` with `OverlayController` support.',
  propDescriptions: {
    open: 'Controls visibility when rendered as an overlay panel.',
    inline: 'Renders the notification list inline rather than as a floating overlay.',
    heading: 'Optional heading overriding the localized default title.',
    maxItems: 'Maximum number of visible notifications rendered in the list.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before opening.',
    'mth-after-open': 'Fired after opening.',
    'mth-close': 'Cancelable event fired before closing.',
    'mth-after-close': 'Fired after closing.',
    'mth-dismiss': 'Fired when a notification entry is dismissed.',
    'mth-clear': 'Fired when all notifications are cleared.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Tray background color' },
    { name: '--mth-color-fg', description: 'Foreground text color' },
    { name: '--mth-color-border', description: 'Card and divider border color' },
    { name: '--mth-color-accent', description: 'Unread badge accent color' },
    { name: '--mth-radius-lg', description: 'Tray corner radius' },
    { name: '--mth-shadow-lg', description: 'Tray elevation shadow' },
  ],
};
