import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { mfaChallengeMessages } from './mfa-challenge.messages.js';

export const mfaChallengeSpec: ComponentBehaviorSpec = {
  tag: 'mth-mfa-challenge',
  package: '@methane/auth',
  conformance: ['form-control', 'roving-focus'],
  controllers: ['FormControlController', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'invalid', 'loading'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'TOTP cell focused', expect: 'Moves focus to next digit cell' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'TOTP cell focused', expect: 'Moves focus to next digit cell in RTL' },
    { key: 'Backspace', when: 'Empty TOTP cell focused', expect: 'Clears previous digit and focuses it' },
  ],
  props: [
    { name: 'mode', attr: 'mode', type: "'totp' | 'backup'", default: 'totp' },
    { name: 'length', attr: 'length', type: 'number', default: 6 },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'loading', attr: 'loading', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: true },
    { name: 'allowResend', attr: 'allow-resend', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string; mode: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; mode: string }' },
    { name: 'mth-complete', cancelable: false, detailType: '{ value: string; mode: string }' },
    { name: 'mth-submit', cancelable: false, detailType: '{ value: string; mode: string }' },
    { name: 'mth-resend', cancelable: false, detailType: 'void' },
    { name: 'mth-mode-change', cancelable: false, detailType: '{ mode: string }' },
  ],
  slots: [{ name: 'default', description: 'Optional helper footer content.' }],
  parts: [
    { name: 'base', description: 'Outer challenge container.' },
    { name: 'digits', description: 'TOTP digit cell group.' },
    { name: 'digit', description: 'Individual TOTP numeric input.' },
    { name: 'backup-input', description: 'Backup code input field.' },
    { name: 'submit', description: 'Verify submit button.' },
  ],
  messages: { ...mfaChallengeMessages },
};

export const CEM_METADATA = {
  description:
    'Multi-factor authentication challenge supporting 6-digit TOTP entry with multi-cell paste and backup recovery code entry.',
  propDescriptions: {
    mode: 'Active challenge verification mode (`totp` | `backup`).',
    length: 'Number of TOTP digit cells.',
    value: 'Current entered verification or backup code.',
    name: 'Form field name submitted via ElementInternals.',
    error: 'External verification error message.',
    loading: 'Disables controls and shows verification submission progress.',
    disabled: 'Disables code entry and action buttons.',
    required: 'Whether a complete verification code is required for form validity.',
    allowResend: 'Whether to display a resend code button.',
  },
  eventDescriptions: {
    'mth-input': 'Emitted on code input.',
    'mth-change': 'Emitted on code commit.',
    'mth-complete': 'Emitted when all TOTP digits are entered.',
    'mth-submit': 'Emitted when verification is submitted.',
    'mth-resend': 'Emitted when the user requests a new code.',
    'mth-mode-change': 'Emitted when toggling between totp and backup modes.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Challenge card surface background.' },
    { name: '--mth-color-border-focus', description: 'Digit input focus outline color.' },
  ],
};
