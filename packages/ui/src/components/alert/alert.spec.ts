import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { alertMessages } from './alert.messages.js';

export const alertSpec: ComponentBehaviorSpec = {
  tag: 'mth-alert',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['open'],
  keyboard: [],
  props: [
    {
      name: 'variant',
      attr: 'variant',
      type: "'info' | 'success' | 'warning' | 'danger'",
      default: 'info',
    },
    { name: 'title', attr: 'title', type: 'string', default: '' },
    { name: 'closable', attr: 'closable', type: 'boolean', default: false },
    { name: 'open', attr: 'open', type: 'boolean', default: true },
  ],
  events: [
    {
      name: 'mth-close',
      cancelable: true,
      detailType: '{ reason: string }',
    },
  ],
  slots: [
    { name: '', description: 'Main alert body message content.' },
    { name: 'icon', description: 'Optional leading icon overriding the default variant icon.' },
    { name: 'title', description: 'Optional custom heading overriding the `title` property.' },
    { name: 'actions', description: 'Optional trailing or footer action controls.' },
  ],
  parts: [
    { name: 'base', description: 'Root alert container with semantic `role="status"` or `role="alert"`.' },
    { name: 'icon', description: 'Leading semantic icon wrapper.' },
    { name: 'content', description: 'Column wrapping alert title and body content.' },
    { name: 'title', description: 'Alert heading wrapper.' },
    { name: 'message', description: 'Alert body message wrapper.' },
    { name: 'actions', description: 'Optional actions slot container.' },
    { name: 'close-button', description: 'Dismiss button rendered when `closable` is true.' },
  ],
  messages: { ...alertMessages },
};

export const CEM_METADATA = {
  description:
    'Inline status and alert banner with semantic live-region roles, variant icons, and optional dismiss control.',
  propDescriptions: {
    variant: 'Semantic intent and live-region role (`info | success` -> `status`; `warning | danger` -> `alert`).',
    title: 'Optional heading text displayed above the alert message.',
    closable: 'Displays a dismiss button that emits a cancelable `mth-close` event.',
    open: 'Controls whether the alert is visible.',
  },
  eventDescriptions: {
    'mth-close': 'Cancelable event fired when the alert is dismissed.',
  },
  cssProperties: [
    { name: '--mth-color-info', description: 'Info variant accent color.' },
    { name: '--mth-color-info-subtle', description: 'Info variant background color.' },
    { name: '--mth-color-success', description: 'Success variant accent color.' },
    { name: '--mth-color-success-subtle', description: 'Success variant background color.' },
    { name: '--mth-color-warning', description: 'Warning variant accent color.' },
    { name: '--mth-color-warning-subtle', description: 'Warning variant background color.' },
    { name: '--mth-color-danger', description: 'Danger variant accent color.' },
    { name: '--mth-color-danger-subtle', description: 'Danger variant background color.' },
    { name: '--mth-radius-md', description: 'Alert container corner radius.' },
  ],
};
