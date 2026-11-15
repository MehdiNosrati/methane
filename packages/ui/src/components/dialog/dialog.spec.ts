import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { dialogMessages } from './dialog.messages.js';

export const dialogSpec: ComponentBehaviorSpec = {
  tag: 'mth-dialog',
  package: '@methane/ui',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'FocusTrapController', 'MotionController'],
  focusModel: 'host',
  states: ['open', 'modal'],
  keyboard: [
    { key: 'Escape', when: 'open and closeOnEscape is true', expect: 'dismisses dialog and restores focus' },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'modal', attr: 'modal', type: 'boolean', default: true },
    {
      name: 'variant',
      attr: 'variant',
      type: "'default' | 'alert' | 'confirm' | 'prompt'",
      default: 'default',
    },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'description', attr: 'description', type: 'string', default: '' },
    { name: 'promptValue', attr: 'prompt-value', type: 'string', default: '' },
    { name: 'closeOnEscape', attr: 'close-on-escape', type: 'boolean', default: true },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'void' },
    { name: 'mth-after-open', cancelable: false, detailType: 'void' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: '{ reason: string }' },
    {
      name: 'mth-confirm',
      cancelable: false,
      detailType: '{ variant: string; value?: string }',
    },
    { name: 'mth-cancel', cancelable: false, detailType: '{ variant: string }' },
  ],
  slots: [
    { name: '', description: 'Main dialog body content.' },
    { name: 'header', description: 'Optional custom header replacing default title text.' },
    { name: 'footer', description: 'Dialog footer actions.' },
  ],
  parts: [
    { name: 'base', description: 'Native internal `<dialog>` element.' },
    { name: 'popup', description: 'Visual dialog panel surface.' },
    { name: 'header', description: 'Dialog header row.' },
    { name: 'title', description: 'Dialog heading element.' },
    { name: 'close-button', description: 'Dismiss button in dialog header.' },
    { name: 'body', description: 'Dialog body content region.' },
    { name: 'prompt-input', description: 'Text input field rendered for `variant="prompt"`.' },
    { name: 'footer', description: 'Dialog footer action bar.' },
  ],
  messages: { ...dialogMessages },
};

export const CEM_METADATA = {
  description:
    'Top-layer modal and non-modal dialog wrapping native `<dialog>` with default, alert, confirm, and prompt variants.',
  propDescriptions: {
    open: 'Controls open visibility of the dialog.',
    modal: 'Opens as modal top-layer dialog with backdrop and focus trap when true.',
    variant: 'Built-in semantic dialog preset (`default | alert | confirm | prompt`).',
    label: 'Accessible dialog title rendered in header.',
    description: 'Optional descriptive copy for alert/confirm/prompt dialogs.',
    promptValue: 'Current input value when `variant="prompt"`.',
    closeOnEscape: 'Allows dismissing the dialog via the Escape key.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before opening the dialog.',
    'mth-after-open': 'Fired once the entry transition settles.',
    'mth-close': 'Cancelable event fired before closing the dialog.',
    'mth-after-close': 'Fired once exit transition settles and focus restores.',
    'mth-confirm': 'Fired when the primary confirm/ok action button is clicked.',
    'mth-cancel': 'Fired when the secondary cancel action button is clicked.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Dialog panel background.' },
    { name: '--mth-color-backdrop', description: 'Backdrop color behind modal dialogs.' },
    { name: '--mth-radius-lg', description: 'Dialog panel corner radius.' },
    { name: '--mth-shadow-lg', description: 'Dialog panel elevation shadow.' },
  ],
};
