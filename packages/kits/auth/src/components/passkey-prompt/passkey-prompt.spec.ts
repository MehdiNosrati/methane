import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { passkeyPromptMessages } from './passkey-prompt.messages.js';

export const passkeyPromptSpec: ComponentBehaviorSpec = {
  tag: 'mth-passkey-prompt',
  package: '@methane/auth',
  conformance: [],
  controllers: [],
  focusModel: 'host',
  states: ['disabled'],
  keyboard: [],
  props: [
    { name: 'mode', attr: 'mode', type: "'signin' | 'register'", default: 'signin' },
    {
      name: 'status',
      attr: 'status',
      type: "'idle' | 'pending' | 'success' | 'error' | 'unsupported'",
      default: 'idle',
    },
    { name: 'username', attr: 'username', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'conditional', attr: 'conditional', type: 'boolean', default: true },
    { name: 'allowFallback', attr: 'allow-fallback', type: 'boolean', default: true },
  ],
  events: [
    {
      name: 'mth-passkey-auth',
      cancelable: false,
      detailType: '{ mode: string; username: string; conditionalSupported: boolean }',
    },
    { name: 'mth-fallback', cancelable: false, detailType: '{ mode: string; reason: string }' },
  ],
  slots: [{ name: 'default', description: 'Optional extra guidance or provider footer.' }],
  parts: [
    { name: 'base', description: 'Outer passkey prompt card.' },
    { name: 'action', description: 'Primary passkey CTA button.' },
    { name: 'fallback', description: 'Alternate sign-in method button.' },
  ],
  messages: { ...passkeyPromptMessages },
};

export const CEM_METADATA = {
  description:
    'WebAuthn passkey registration and sign-in prompt with PublicKeyCredential feature detection and fallback trigger.',
  propDescriptions: {
    mode: 'Whether authenticating with an existing passkey or enrolling a new one.',
    status: 'Current WebAuthn prompt lifecycle state.',
    username: 'Optional user identifier associated with the passkey prompt.',
    error: 'Explicit failure message displayed to the user.',
    disabled: 'Disables trigger and fallback controls.',
    conditional: 'Whether to check WebAuthn conditional mediation support.',
    allowFallback: 'Displays the alternate authentication method button.',
  },
  eventDescriptions: {
    'mth-passkey-auth': 'Emitted when the user initiates WebAuthn passkey verification or registration.',
    'mth-fallback': 'Emitted when the user selects another sign-in method.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Prompt card surface background.' },
    { name: '--mth-color-accent', description: 'Primary passkey CTA background.' },
  ],
};
