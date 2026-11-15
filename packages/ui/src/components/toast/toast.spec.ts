import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { toastMessages } from './toast.messages.js';

export const toastSpec: ComponentBehaviorSpec = {
  tag: 'mth-toast',
  package: '@methane/ui',
  conformance: [],
  controllers: ['NotificationStoreController', 'OverlayController', 'MotionController'],
  focusModel: 'none',
  states: ['open', 'paused'],
  keyboard: [
    {
      key: 'Escape',
      when: 'toast is focused and closable is true',
      expect: 'dismisses toast notification',
    },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    {
      name: 'variant',
      attr: 'variant',
      type: "'info' | 'success' | 'warning' | 'danger'",
      default: 'info',
    },
    { name: 'duration', attr: 'duration', type: 'number', default: 5000 },
    { name: 'closable', attr: 'closable', type: 'boolean', default: true },
    {
      name: 'placement',
      attr: 'placement',
      type: "'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end'",
      default: 'bottom-end',
    },
    { name: 'heading', attr: 'heading', type: 'string', default: '' },
    { name: 'message', attr: 'message', type: 'string', default: '' },
    { name: 'forceFallback', attr: 'force-fallback', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'void' },
    { name: 'mth-after-open', cancelable: false, detailType: 'void' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: '{ reason: string }' },
  ],
  slots: [
    { name: '', description: 'Toast message body content.' },
    { name: 'title', description: 'Optional custom toast title.' },
    { name: 'icon', description: 'Optional leading status icon.' },
    { name: 'action', description: 'Optional inline action button.' },
  ],
  parts: [
    { name: 'region', description: 'Viewport-pinned notification stack region.' },
    { name: 'base', description: 'Individual standalone toast surface.' },
    { name: 'item', description: 'Store-backed notification item card.' },
    { name: 'icon', description: 'Leading status indicator.' },
    { name: 'content', description: 'Title and message text container.' },
    { name: 'title', description: 'Toast title element.' },
    { name: 'message', description: 'Toast message body wrapper.' },
    { name: 'actions', description: 'Trailing action slot container.' },
    { name: 'close-button', description: 'Dismiss button rendered when closable.' },
  ],
  messages: { ...toastMessages },
};

export const CEM_METADATA = {
  description:
    'Non-intrusive notification toast and runtime `NotificationStore` viewport with pause-on-hover/focus, `LiveAnnouncer` integration, and logical placement.',
  propDescriptions: {
    open: 'Controls standalone toast visibility.',
    variant: 'Semantic visual tone (`info | success | warning | danger`).',
    duration: 'Auto-dismiss duration in milliseconds (`0` disables auto-dismiss).',
    closable: 'Shows a dismiss button when true.',
    placement: 'Logical viewport corner or edge alignment.',
    heading: 'Optional toast heading text.',
    message: 'Optional plain-text body overriding default slot fallback.',
    forceFallback: 'Forces non-top-layer fallback mode.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before showing the toast.',
    'mth-after-open': 'Fired once the entry animation completes.',
    'mth-close': 'Cancelable event fired before dismissing the toast.',
    'mth-after-close': 'Fired once the exit animation completes.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Toast card background.' },
    { name: '--mth-color-info', description: 'Info variant accent color.' },
    { name: '--mth-color-success', description: 'Success variant accent color.' },
    { name: '--mth-color-warning', description: 'Warning variant accent color.' },
    { name: '--mth-color-danger', description: 'Danger variant accent color.' },
  ],
};
