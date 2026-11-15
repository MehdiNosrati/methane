import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { emojiPickerMessages } from './emoji-picker.messages.js';

export const emojiPickerSpec: ComponentBehaviorSpec = {
  tag: 'mth-emoji-picker',
  package: '@methane/ui',
  conformance: ['roving-focus', 'overlay'],
  controllers: ['RovingFocusController', 'OverlayController', 'PositioningController'],
  focusModel: 'delegates-focus',
  states: ['open', 'disabled'],
  keyboard: [
    { key: 'ArrowLeft / ArrowRight / ArrowUp / ArrowDown', when: 'emoji grid focused', expect: 'moves focus across emoji grid cells (RTL-aware)' },
    { key: 'Home / End', when: 'emoji grid focused', expect: 'moves focus to first or last emoji in grid' },
    { key: 'Enter / Space', when: 'emoji button focused', expect: 'selects emoji and fires mth-select' },
    { key: 'Escape', when: 'popover mode open', expect: 'closes picker popover and restores focus' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'inline', attr: 'inline', type: 'boolean', default: false },
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'columns', attr: 'columns', type: 'number', default: 6 },
    { name: 'skinTone', attr: 'skin-tone', type: 'number', default: 0 },
    { name: 'recentLimit', attr: 'recent-limit', type: 'number', default: 12 },
    { name: 'emojis', attr: false, type: 'ReadonlyArray<EmojiEntry> | null', default: null },
  ],
  events: [
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ emoji: string; name: string; category: string }',
    },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-open', cancelable: true, detailType: 'undefined' },
    { name: 'mth-after-open', cancelable: false, detailType: 'undefined' },
    { name: 'mth-close', cancelable: true, detailType: 'undefined' },
    { name: 'mth-after-close', cancelable: false, detailType: 'undefined' },
  ],
  slots: [{ name: 'trigger', description: 'Optional custom trigger label content.' }],
  parts: [
    { name: 'base', description: 'Outer wrapper.' },
    { name: 'trigger', description: 'Popover trigger button when not inline.' },
    { name: 'panel', description: 'Emoji picker surface container.' },
    { name: 'header', description: 'Search input and skin-tone selector row.' },
    { name: 'search', description: 'Emoji search input.' },
    { name: 'skin-tones', description: 'Skin-tone modifier selector group.' },
    { name: 'categories', description: 'Category filter bar.' },
    { name: 'category', description: 'Category filter button.' },
    { name: 'grid', description: 'Roving-focus emoji grid container.' },
    { name: 'emoji-button', description: 'Selectable emoji cell button.' },
  ],
  messages: { ...emojiPickerMessages },
};

export const CEM_METADATA = {
  description: 'Accessible emoji picker with keyword search, categories, skin tones, recent history, and 2D roving focus.',
  propDescriptions: {
    value: 'Currently selected emoji string.',
    label: 'Accessible label for the picker trigger and panel.',
    inline: 'Renders the picker panel inline instead of a trigger-backed popover.',
    open: 'Controls whether the popover panel is open when inline is false.',
    disabled: 'Disables interaction with trigger and picker controls.',
    columns: 'Number of grid columns used for 2D arrow-key navigation.',
    skinTone: 'Active Fitzpatrick skin tone modifier index (0 = default, 1-5 = tones).',
    recentLimit: 'Maximum number of recently picked emojis retained.',
    emojis: 'Optional custom emoji dataset overriding the built-in curated set.',
  },
  eventDescriptions: {
    'mth-select': 'Fired when an emoji is picked from the grid.',
    'mth-change': 'Fired when the selected emoji value changes.',
    'mth-open': 'Cancelable event fired before opening the popover.',
    'mth-after-open': 'Fired after the popover opens.',
    'mth-close': 'Cancelable event fired before closing the popover.',
    'mth-after-close': 'Fired after the popover closes.',
  },
  cssProperties: [
    { name: '--mth-emoji-panel-inline-size', description: 'Inline size of the emoji picker panel.' },
    { name: '--mth-emoji-grid-max-block-size', description: 'Maximum block size of the scrollable emoji grid.' },
  ],
};
