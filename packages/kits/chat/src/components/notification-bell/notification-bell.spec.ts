import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { notificationBellMessages } from './notification-bell.messages.js';

export const notificationBellSpec: ComponentBehaviorSpec = {
  tag: 'mth-notification-bell',
  package: '@methane/chat',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'PositioningController', 'NotificationStoreController'],
  focusModel: 'delegates-focus',
  states: ['open', 'unread'],
  keyboard: [
    {
      key: 'Escape',
      when: 'notification panel is open and closeOnEscape is true',
      expect: 'closes the notification panel and restores focus to the trigger button',
    },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'placement', attr: 'placement', type: 'string', default: 'bottom-end' },
    { name: 'offset', attr: 'offset', type: 'number', default: 8 },
    { name: 'closeOnEscape', attr: 'close-on-escape', type: 'boolean', default: true },
    { name: 'forceFallback', attr: 'force-fallback', type: 'boolean', default: false },
    { name: 'unreadCount', attr: 'unread-count', type: 'number | null', default: null },
    { name: 'maxCount', attr: 'max-count', type: 'number', default: 99 },
    { name: 'useStore', attr: 'use-store', type: 'boolean', default: true },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    {
      name: 'items',
      attr: false,
      type: 'ReadonlyArray<NotificationBellItem>',
    },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'void' },
    { name: 'mth-after-open', cancelable: false, detailType: 'void' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: '{ reason: string }' },
    { name: 'mth-item-select', cancelable: false, detailType: '{ id: string }' },
    { name: 'mth-item-dismiss', cancelable: false, detailType: '{ id: string }' },
    { name: 'mth-mark-all-read', cancelable: false, detailType: 'void' },
  ],
  slots: [
    { name: 'icon', description: 'Optional custom bell icon inside the trigger button.' },
    { name: 'header-actions', description: 'Optional extra actions in the popover header.' },
    { name: 'footer', description: 'Optional footer content below the notification list.' },
  ],
  parts: [
    { name: 'base', description: 'Root wrapper element.' },
    { name: 'trigger', description: 'Icon button toggling the notification panel.' },
    { name: 'badge', description: 'Unread notification count badge.' },
    { name: 'panel', description: 'Floating notification popover surface.' },
    { name: 'header', description: 'Notification panel header with heading and actions.' },
    { name: 'list', description: 'Scrollable notification items list.' },
    { name: 'item', description: 'Individual notification row.' },
    { name: 'empty', description: 'Empty-state panel content when there are no notifications.' },
  ],
  messages: { ...notificationBellMessages },
};

export const CEM_METADATA = {
  description:
    'Notification bell trigger with unread badge and accessible anchored notification feed popover.',
  propDescriptions: {
    open: 'Controls open visibility of the notification popover.',
    placement: 'Preferred popover placement relative to the bell button.',
    offset: 'Pixel offset between bell trigger and notification panel.',
    closeOnEscape: 'Allows dismissing the panel with the Escape key.',
    forceFallback: 'Forces non-top-layer positioning fallback mode.',
    unreadCount: 'Optional explicit unread count overriding computed item count.',
    maxCount: 'Maximum unread count before appending `+`.',
    useStore: 'Subscribes to the shared `@methane/core` runtime notification store.',
    label: 'Optional accessible label for the notification bell button.',
    items: 'Structured list of notification items rendered in the panel.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event emitted before opening the notification panel.',
    'mth-after-open': 'Emitted after opening completes.',
    'mth-close': 'Cancelable event emitted before closing the notification panel.',
    'mth-after-close': 'Emitted after closing completes.',
    'mth-item-select': 'Emitted when the user activates a notification item.',
    'mth-item-dismiss': 'Emitted when a notification item is dismissed.',
    'mth-mark-all-read': 'Emitted when the user activates Mark all read.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Notification panel surface background.' },
    { name: '--mth-color-border', description: 'Notification panel and row divider border color.' },
    { name: '--mth-color-accent', description: 'Unread dot indicator and focus accent color.' },
    { name: '--mth-shadow-lg', description: 'Floating notification panel elevation shadow.' },
  ],
};
