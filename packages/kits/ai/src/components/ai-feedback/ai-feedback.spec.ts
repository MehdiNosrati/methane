import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { aiFeedbackMessages } from './ai-feedback.messages.js';

export const aiFeedbackSpec: ComponentBehaviorSpec = {
  tag: 'mth-ai-feedback',
  package: '@methane-ui/ai',
  conformance: ['roving-focus'],
  controllers: ['SelectionController', 'RovingFocusController'],
  focusModel: 'none',
  states: ['positive', 'negative', 'submitted', 'disabled'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'feedback button focused', expect: 'moves focus to next control (RTL flipped)' },
    { key: 'ArrowLeft', dir: 'ltr', when: 'feedback button focused', expect: 'moves focus to previous control (RTL flipped)' },
    { key: 'Home', when: 'feedback button focused', expect: 'moves focus to first control' },
    { key: 'End', when: 'feedback button focused', expect: 'moves focus to last control' },
  ],
  props: [
    { name: 'rating', attr: 'rating', type: "'' | 'up' | 'down'", default: '' },
    { name: 'reasons', attr: false, type: 'string[]' },
    { name: 'selectedReasons', attr: false, type: 'string[]' },
    { name: 'comment', attr: 'comment', type: 'string', default: '' },
    { name: 'submitted', attr: 'submitted', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-feedback',
      cancelable: false,
      detailType: "{ rating: '' | 'up' | 'down'; reasons: string[]; comment: string; submitted: boolean }",
    },
  ],
  slots: [{ name: '', description: 'Optional extra actions beside the rating buttons.' }],
  parts: [
    { name: 'base', description: 'Root feedback group container.' },
    { name: 'feedback-control', description: 'Focusable rating and reason toggle buttons.' },
    { name: 'comment-input', description: 'Optional follow-up feedback text input.' },
    { name: 'submit-button', description: 'Submit button shown when detailed feedback is open.' },
  ],
  messages: { ...aiFeedbackMessages },
};

export const CEM_METADATA = {
  description:
    'AI response rating control with thumbs up/down, multi-select reason chips (`SelectionController`), and RTL-aware roving focus.',
  propDescriptions: {
    rating: "Current feedback polarity (`''` | `'up'` | `'down'`).",
    reasons: 'Optional custom reason labels overriding localized defaults.',
    selectedReasons: 'Currently selected negative-feedback reason identifiers.',
    comment: 'Optional free-text user comment.',
    submitted: 'Marks feedback as submitted and displays confirmation notice.',
    disabled: 'Disables all feedback interactions.',
    label: 'Accessible toolbar group label.',
  },
  eventDescriptions: {
    'mth-feedback': 'Fired whenever rating changes or detailed feedback is submitted.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Button background color.' },
    { name: '--mth-color-accent', description: 'Active chip border accent color.' },
    { name: '--mth-radius-md', description: 'Comment input corner radius.' },
  ],
};
