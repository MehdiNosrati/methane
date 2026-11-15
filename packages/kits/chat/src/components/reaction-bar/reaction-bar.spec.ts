import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { reactionBarMessages } from './reaction-bar.messages.js';

export const reactionBarSpec: ComponentBehaviorSpec = {
  tag: 'mth-reaction-bar',
  package: '@methane/chat',
  conformance: ['roving-focus'],
  controllers: ['SelectionController', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['disabled'],
  keyboard: [
    { key: 'ArrowLeft / ArrowRight', when: 'reaction pill focused', expect: 'moves focus across reaction pills (RTL-aware)' },
    { key: 'Home / End', when: 'reaction pill focused', expect: 'jumps to first or last reaction item' },
    { key: 'Enter / Space', when: 'reaction pill focused', expect: 'toggles selection and emits mth-change' },
  ],
  props: [
    { name: 'reactions', attr: false, type: 'ReadonlyArray<ReactionItem>' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'multiple', attr: 'multiple', type: 'boolean', default: true },
    { name: 'allowAdd', attr: 'allow-add', type: 'boolean', default: true },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; values: ReadonlyArray<string>; emoji: string; selected: boolean }' },
    { name: 'mth-add-reaction', cancelable: false, detailType: 'undefined' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Reaction bar toolbar container.' },
    { name: 'pill', description: 'Individual reaction toggle button.' },
    { name: 'emoji', description: 'Reaction emoji glyph.' },
    { name: 'count', description: 'Localized reaction count.' },
    { name: 'add-button', description: 'Button to add a new reaction.' },
  ],
  messages: { ...reactionBarMessages },
};

export const CEM_METADATA = {
  description:
    'Accessible emoji reaction pill bar with SelectionController toggling and RTL-aware RovingFocusController navigation.',
  propDescriptions: {
    reactions: 'List of reaction entries (`{ emoji, count, active?, label?, disabled? }`).',
    value: 'Comma-separated list of currently selected reaction emojis.',
    multiple: 'Allows toggling multiple reaction pills simultaneously.',
    allowAdd: 'Shows the trailing add-reaction action button.',
    disabled: 'Disables all reaction interactions.',
    label: 'Accessible group label for the reaction bar.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when a reaction pill selection changes.',
    'mth-add-reaction': 'Fired when the add-reaction button is activated.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Inactive reaction pill background.' },
    { name: '--mth-color-accent-subtle', description: 'Active reaction pill background.' },
  ],
};
