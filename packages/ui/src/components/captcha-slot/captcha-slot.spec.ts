import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { captchaSlotMessages } from './captcha-slot.messages.js';

export const captchaSlotSpec: ComponentBehaviorSpec = {
  tag: 'mth-captcha-slot',
  package: '@methane-ui/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'ContextProtocol'],
  focusModel: 'delegates-focus',
  states: ['dirty', 'touched', 'user-invalid', 'disabled', 'required', 'readonly'],
  keyboard: [
    { key: 'Enter', when: 'reset button focused', expect: 'clears current verification token and emits mth-expire' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'provider', attr: 'provider', type: 'string', default: 'custom' },
    { name: 'sitekey', attr: 'sitekey', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-verify', cancelable: false, detailType: '{ token: string; provider: string }' },
    { name: 'mth-expire', cancelable: false, detailType: '{ provider: string }' },
    { name: 'mth-error', cancelable: false, detailType: '{ provider: string; message: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
  ],
  slots: [
    { name: 'default', description: 'Light-DOM provider widget mount container (Turnstile/hCaptcha/reCAPTCHA).' },
    { name: 'label', description: 'Optional accessible label slot.' },
    { name: 'hint', description: 'Helper text slot.' },
    { name: 'error', description: 'Error text slot.' },
    { name: 'fallback', description: 'Fallback content shown when no provider widget is mounted.' },
  ],
  parts: [
    { name: 'base', description: 'Outer field stack.' },
    { name: 'label', description: 'Group label element.' },
    { name: 'container', description: 'Light-DOM provider widget wrapper.' },
    { name: 'status', description: 'Accessible status indicator and reset action.' },
    { name: 'reset', description: 'Reset challenge button.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Error message container.' },
  ],
  messages: { ...captchaSlotMessages },
};

export const CEM_METADATA = {
  description:
    'Provider-agnostic Light-DOM CAPTCHA container bridging third-party verification widgets with FACE token validity and same-root ARIA.',
  propDescriptions: {
    value: 'Current verification token submitted in FormData.',
    name: 'Form submission field name.',
    label: 'Accessible group label.',
    hint: 'Helper text displayed below container.',
    error: 'Explicit error message.',
    provider: 'CAPTCHA provider identifier (e.g. `"turnstile"`, `"hcaptcha"`, `"recaptcha"`, `"custom"`).',
    sitekey: 'Optional public site key forwarded via data attribute.',
    disabled: 'Disables interaction.',
    required: 'Marks verification token required for form validity.',
    readonly: 'Prevents token clearing or edits.',
  },
  eventDescriptions: {
    'mth-verify': 'Fired when a non-empty verification token is set.',
    'mth-expire': 'Fired when verification expires or resets.',
    'mth-error': 'Fired when provider reports an error.',
    'mth-change': 'Fired when the verification token changes.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Container background color.' },
    { name: '--mth-color-border', description: 'Container border color.' },
    { name: '--mth-color-success', description: 'Verified indicator color.' },
    { name: '--mth-radius-md', description: 'Container corner radius.' },
  ],
};
