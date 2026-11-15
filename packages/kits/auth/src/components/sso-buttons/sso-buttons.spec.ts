import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { ssoButtonsMessages } from './sso-buttons.messages.js';

export const ssoButtonsSpec: ComponentBehaviorSpec = {
  tag: 'mth-sso-buttons',
  package: '@methane/auth',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'none',
  states: ['disabled', 'loading'],
  keyboard: [
    { key: 'ArrowDown', when: 'vertical provider button focused', expect: 'moves focus to next provider button' },
    { key: 'ArrowUp', when: 'vertical provider button focused', expect: 'moves focus to previous provider button' },
    { key: 'Home', when: 'provider button focused', expect: 'moves focus to first provider button' },
    { key: 'End', when: 'provider button focused', expect: 'moves focus to last provider button' },
  ],
  props: [
    { name: 'providers', attr: false, type: 'SsoProviderItem[]' },
    { name: 'loadingProvider', attr: 'loading-provider', type: 'string', default: '' },
    {
      name: 'orientation',
      attr: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: 'vertical',
    },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-sso-select', cancelable: false, detailType: '{ provider: string; label: string }' },
  ],
  slots: [{ name: '', description: 'Optional extra SSO provider controls.' }],
  parts: [
    { name: 'base', description: 'Root provider group container.' },
    { name: 'provider-button', description: 'Individual SSO provider action button.' },
  ],
  messages: { ...ssoButtonsMessages },
};

export const CEM_METADATA = {
  description:
    'Federated Single Sign-On provider button group with RovingFocusController navigation and per-provider loading state.',
  propDescriptions: {
    providers: 'Array of `{ id, label?, disabled? }` SSO provider entries.',
    loadingProvider: 'ID of the provider currently authenticating.',
    orientation: 'Stack direction (`vertical` | `horizontal`).',
    disabled: 'Disables all provider buttons.',
    label: 'Accessible group label.',
  },
  eventDescriptions: {
    'mth-sso-select': 'Fired when an enabled SSO provider button is activated.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Provider button background.' },
    { name: '--mth-color-border', description: 'Provider button border.' },
    { name: '--mth-radius-md', description: 'Provider button corner radius.' },
  ],
};
