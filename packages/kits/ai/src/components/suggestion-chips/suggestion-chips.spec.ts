import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { suggestionChipsMessages } from './suggestion-chips.messages.js';

export const suggestionChipsSpec: ComponentBehaviorSpec = {
  tag: 'mth-suggestion-chips',
  package: '@methane/ai',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'none',
  states: ['disabled'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'chip focused', expect: 'moves focus to next suggestion (RTL flipped)' },
    { key: 'ArrowLeft', dir: 'ltr', when: 'chip focused', expect: 'moves focus to previous suggestion (RTL flipped)' },
    { key: 'Home', when: 'chip focused', expect: 'moves focus to first suggestion' },
    { key: 'End', when: 'chip focused', expect: 'moves focus to last suggestion' },
  ],
  props: [
    { name: 'items', attr: false, type: 'SuggestionChipItem[]' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    {
      name: 'orientation',
      attr: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: 'horizontal',
    },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
  ],
  events: [
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ label: string; value: string; index: number }',
    },
  ],
  slots: [{ name: '', description: 'Optional trailing custom suggestions.' }],
  parts: [
    { name: 'base', description: 'Container group holding suggestion chips.' },
    { name: 'chip', description: 'Individual selectable prompt chip button.' },
  ],
  messages: { ...suggestionChipsMessages },
};

export const CEM_METADATA = {
  description:
    'Starter prompt chip bar with RTL-aware RovingFocusController navigation and `mth-select` event dispatch.',
  propDescriptions: {
    items: 'Array of `{ id?, label, value?, prompt?, disabled? }` starter prompt items.',
    label: 'Accessible region label for the suggestion bar.',
    orientation: 'Horizontal or vertical chip flow.',
    disabled: 'Disables all suggestion chips.',
  },
  eventDescriptions: {
    'mth-select': 'Fired when the user activates a suggestion chip.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Chip background color.' },
    { name: '--mth-color-accent-subtle', description: 'Chip hover background color.' },
    { name: '--mth-radius-full', description: 'Chip pill border radius.' },
  ],
};
