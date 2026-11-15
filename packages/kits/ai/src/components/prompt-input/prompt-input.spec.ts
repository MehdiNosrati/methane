import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { promptInputMessages } from './prompt-input.messages.js';

export const promptInputSpec: ComponentBehaviorSpec = {
  tag: 'mth-prompt-input',
  package: '@methane-ui/ai',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'InputController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'streaming', 'invalid', 'dirty', 'touched', 'empty'],
  keyboard: [
    {
      key: 'Enter',
      when: 'focused and submitOnEnter is true without Shift or IME composition',
      expect: 'emits cancelable mth-submit with current value',
    },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'streaming', attr: 'streaming', type: 'boolean', default: false },
    { name: 'submitOnEnter', attr: 'submit-on-enter', type: 'boolean', default: true },
    { name: 'maxRows', attr: 'max-rows', type: 'number', default: 6 },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-submit', cancelable: true, detailType: '{ value: string }' },
    { name: 'mth-stop', cancelable: false, detailType: 'void' },
  ],
  slots: [
    { name: 'attachments', description: 'Optional file or context attachment chips above/beside the composer.' },
    { name: 'model', description: 'Optional model selector control in the composer toolbar.' },
    { name: 'actions', description: 'Additional toolbar controls placed beside the submit button.' },
  ],
  parts: [
    { name: 'base', description: 'Outer wrapper containing label, composer, hint, and error.' },
    { name: 'label', description: 'Prompt label element.' },
    { name: 'composer', description: 'Bordered prompt box.' },
    { name: 'textarea', description: 'Internal auto-sizing `<textarea>` element.' },
    { name: 'footer', description: 'Toolbar row for attachments, model slot, and submit/stop button.' },
    { name: 'submit-button', description: 'Primary send button.' },
    { name: 'stop-button', description: 'Stop generation button rendered while `streaming` is true.' },
    { name: 'hint', description: 'Helper text below the composer.' },
    { name: 'error', description: 'Validation error message below the composer.' },
  ],
  messages: { ...promptInputMessages },
};

export const CEM_METADATA = {
  description:
    'IME-safe auto-sizing AI prompt composer with FormControlController integration, Enter/Mod+Enter submission, and stop-generation state.',
  propDescriptions: {
    value: 'Current prompt text value.',
    name: 'Form field name submitted via ElementInternals.',
    label: 'Accessible field label.',
    placeholder: 'Textarea placeholder text.',
    hint: 'Optional helper text displayed below the composer.',
    error: 'Explicit error text displayed when invalid.',
    disabled: 'Disables prompt input and submission.',
    required: 'Marks the prompt as required for form validation.',
    streaming: 'Switches the primary control into stop-generation mode.',
    submitOnEnter: 'When true, Enter submits and Shift+Enter adds a newline; when false, Mod+Enter submits.',
    maxRows: 'Maximum visible auto-sized row count.',
  },
  eventDescriptions: {
    'mth-input': 'Fired as the user types prompt text (after IME composition ends).',
    'mth-change': 'Fired when the prompt input commits on blur/change.',
    'mth-submit': 'Cancelable event fired when submitting the prompt.',
    'mth-stop': 'Fired when the user activates the stop-generation button.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Composer background color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring and active border color.' },
    { name: '--mth-radius-lg', description: 'Composer corner radius.' },
  ],
};
