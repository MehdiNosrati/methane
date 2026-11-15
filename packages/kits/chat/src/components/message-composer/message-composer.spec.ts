import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { messageComposerMessages } from './message-composer.messages.js';

export const messageComposerSpec: ComponentBehaviorSpec = {
  tag: 'mth-message-composer',
  package: '@methane/chat',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'InputController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'streaming', 'invalid'],
  keyboard: [
    { key: 'Enter', when: 'submitOnEnter is true and IME is not composing', expect: 'submits message and emits mth-submit' },
    { key: 'Mod+Enter', when: 'textarea focused and IME is not composing', expect: 'submits message and emits mth-submit' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'defaultValue', attr: 'default-value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'streaming', attr: 'streaming', type: 'boolean', default: false },
    { name: 'submitOnEnter', attr: 'submit-on-enter', type: 'boolean', default: true },
    { name: 'maxLength', attr: 'max-length', type: 'number', default: 0 },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-submit', cancelable: true, detailType: '{ value: string }' },
    { name: 'mth-stop', cancelable: false, detailType: 'undefined' },
    { name: 'mth-attach', cancelable: false, detailType: 'undefined' },
    { name: 'mth-emoji', cancelable: false, detailType: 'undefined' },
  ],
  slots: [
    { name: 'label', description: 'Optional custom label.' },
    { name: 'actions-start', description: 'Leading toolbar controls.' },
    { name: 'actions-end', description: 'Trailing toolbar controls.' },
    { name: 'hint', description: 'Helper text.' },
    { name: 'error', description: 'Validation error message.' },
  ],
  parts: [
    { name: 'base', description: 'Outer composer shell.' },
    { name: 'label', description: 'Internal same-root label.' },
    { name: 'textarea', description: 'Native message textarea.' },
    { name: 'toolbar', description: 'Composer action toolbar.' },
    { name: 'attach-button', description: 'Attachment trigger button.' },
    { name: 'emoji-button', description: 'Emoji picker trigger button.' },
    { name: 'send-button', description: 'Send message submit button.' },
    { name: 'stop-button', description: 'Stop streaming button.' },
    { name: 'hint', description: 'Helper message.' },
    { name: 'error', description: 'Error message.' },
  ],
  messages: { ...messageComposerMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated IME-safe chat message composer with Enter / Mod+Enter submit, attachment and emoji triggers, and streaming stop state.',
  propDescriptions: {
    value: 'Current message draft text.',
    defaultValue: 'Initial form reset value.',
    name: 'Form field submission name.',
    label: 'Accessible label for the composer.',
    placeholder: 'Placeholder text shown inside empty textarea.',
    hint: 'Helper guidance shown below the composer.',
    error: 'Custom validation error text.',
    disabled: 'Disables editing and action buttons.',
    required: 'Marks a non-empty message as required.',
    streaming: 'Displays stop-generation button instead of send while streaming.',
    submitOnEnter: 'Submits on bare Enter (Shift+Enter inserts newline).',
    maxLength: 'Optional maximum character limit (`0` for unlimited).',
  },
  eventDescriptions: {
    'mth-input': 'Fired as draft text changes.',
    'mth-change': 'Fired when draft commits on blur.',
    'mth-submit': 'Cancelable event fired when user submits a non-empty message.',
    'mth-stop': 'Fired when the user cancels streaming generation.',
    'mth-attach': 'Fired when attachment trigger is pressed.',
    'mth-emoji': 'Fired when emoji trigger is pressed.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Composer surface background.' },
    { name: '--mth-color-border-focus', description: 'Focus ring outline color.' },
    { name: '--mth-radius-lg', description: 'Composer corner radius.' },
  ],
};
