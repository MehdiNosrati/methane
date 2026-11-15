import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const shareButtonSpec: ComponentBehaviorSpec = {
  tag: 'mth-share-button',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['shared', 'disabled'],
  keyboard: [
    { key: 'Enter', when: 'Button is focused and enabled', expect: 'Invokes Web Share API or clipboard fallback and emits mth-share' },
    { key: ' ', when: 'Button is focused and enabled', expect: 'Invokes Web Share API or clipboard fallback and emits mth-share' },
  ],
  props: [
    { name: 'shareTitle', attr: 'share-title', type: 'string', default: '' },
    { name: 'text', attr: 'text', type: 'string', default: '' },
    { name: 'url', attr: 'url', type: 'string', default: '' },
    { name: 'variant', attr: 'variant', type: "'solid' | 'outline' | 'ghost'", default: 'outline' },
    { name: 'size', attr: 'size', type: "'sm' | 'md' | 'lg'", default: 'md' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'feedbackDuration', attr: 'feedback-duration', type: 'number', default: 2000 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'sharedLabel', attr: 'shared-label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-share', cancelable: false, detailType: '{ method: string; title?: string; text?: string; url?: string }' },
    { name: 'mth-share-error', cancelable: false, detailType: '{ reason: string }' },
  ],
  slots: [
    { name: '', description: 'Idle share button label/icon.' },
    { name: 'shared', description: 'Content displayed during shared/copied feedback.' },
  ],
  parts: [
    { name: 'base', description: 'Native `<button>` share trigger.' },
  ],
  messages: {
    share: 'Share',
    shared: 'Link ready to share',
  },
};

export const CEM_METADATA = {
  description: 'Web Share API trigger button with automatic safe-URL validation and clipboard fallback.',
  propDescriptions: {
    shareTitle: 'Title passed to `navigator.share`.',
    text: 'Descriptive share body text.',
    url: 'Safe URL to share (rejects unsafe protocols like `javascript:` or `data:`).',
    variant: 'Button visual style (`solid`, `outline`, or `ghost`).',
    size: 'Control size (`sm`, `md`, or `lg`).',
    disabled: 'Disables interaction.',
    feedbackDuration: 'Duration in ms to show shared feedback state.',
    label: 'Accessible `aria-label` when idle.',
    sharedLabel: 'Accessible label/announcement text after sharing.',
  },
  eventDescriptions: {
    'mth-share': 'Fired after sharing succeeds via Web Share or clipboard fallback.',
    'mth-share-error': 'Fired if sharing fails or payload URL is unsafe/empty.',
  },
  cssProperties: [
    { name: '--mth-color-success', description: 'Shared confirmation border/foreground accent.' },
    { name: '--mth-color-border', description: 'Default button border.' },
  ],
};
