import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const copyButtonSpec: ComponentBehaviorSpec = {
  tag: 'mth-copy-button',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['copied', 'disabled'],
  keyboard: [
    { key: 'Enter', when: 'Button is focused and enabled', expect: 'Copies value to clipboard and announces copied feedback' },
    { key: ' ', when: 'Button is focused and enabled', expect: 'Copies value to clipboard and announces copied feedback' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'target', attr: 'target', type: 'string', default: '' },
    { name: 'feedbackDuration', attr: 'feedback-duration', type: 'number', default: 2000 },
    { name: 'variant', attr: 'variant', type: "'solid' | 'outline' | 'ghost'", default: 'outline' },
    { name: 'size', attr: 'size', type: "'sm' | 'md' | 'lg'", default: 'md' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'copiedLabel', attr: 'copied-label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-copy', cancelable: false, detailType: '{ value: string; method: string }' },
    { name: 'mth-copy-error', cancelable: false, detailType: '{ reason: string }' },
  ],
  slots: [
    { name: '', description: 'Idle button label/icon content.' },
    { name: 'copied', description: 'Content rendered while `:state(copied)` is active.' },
  ],
  parts: [
    { name: 'base', description: 'Native `<button>` copy trigger.' },
  ],
  messages: {
    copy: 'Copy',
    copied: 'Copied to clipboard',
  },
};

export const CEM_METADATA = {
  description: 'One-click clipboard copy button with native Clipboard API, execCommand fallback, live-region announcement, and `:state(copied)` feedback.',
  propDescriptions: {
    value: 'Text value to copy directly to the clipboard.',
    target: 'Optional element ID or CSS selector from which to read text/value when `value` is omitted.',
    feedbackDuration: 'Duration in milliseconds to display copied feedback.',
    variant: 'Button variant (`solid`, `outline`, or `ghost`).',
    size: 'Button size (`sm`, `md`, or `lg`).',
    disabled: 'Disables interaction.',
    label: 'Accessible `aria-label` in idle state.',
    copiedLabel: 'Accessible label/announcement text when copied.',
  },
  eventDescriptions: {
    'mth-copy': 'Fired when text is successfully copied to the clipboard.',
    'mth-copy-error': 'Fired if copying fails or no copyable text is available.',
  },
  cssProperties: [
    { name: '--mth-color-success', description: 'Copied feedback border/foreground accent.' },
    { name: '--mth-color-border', description: 'Default button border.' },
  ],
};
