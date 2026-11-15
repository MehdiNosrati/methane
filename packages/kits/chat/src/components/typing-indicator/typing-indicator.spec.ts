import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { typingIndicatorMessages } from './typing-indicator.messages.js';

export const typingIndicatorSpec: ComponentBehaviorSpec = {
  tag: 'mth-typing-indicator',
  package: '@methane-ui/chat',
  conformance: [],
  controllers: ['MotionController'],
  focusModel: 'none',
  states: ['active', 'reduced-motion'],
  keyboard: [],
  props: [
    { name: 'users', attr: false, type: 'ReadonlyArray<string>' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'locale', attr: 'locale', type: 'string', default: '' },
  ],
  events: [],
  slots: [],
  parts: [
    { name: 'base', description: 'Live status container.' },
    { name: 'dots', description: 'Animated typing dots container.' },
    { name: 'dot', description: 'Individual typing dot.' },
    { name: 'text', description: 'Localized typing summary text.' },
  ],
  messages: {
    singleTyping: typingIndicatorMessages.singleTyping,
    pairTyping: typingIndicatorMessages.pairTyping,
    groupTypingOne: typingIndicatorMessages.groupTyping.one,
    groupTypingOther: typingIndicatorMessages.groupTyping.other,
    idleLabel: typingIndicatorMessages.idleLabel,
  },
};

export const CEM_METADATA = {
  description:
    'Accessible live typing indicator using localized pluralized messages and MotionController reduced-motion support.',
  propDescriptions: {
    users: 'Array of display names currently typing.',
    label: 'Optional custom status text overriding generated message.',
    locale: 'Optional BCP 47 locale override for Intl.PluralRules formatting.',
  },
  cssProperties: [
    { name: '--mth-color-fg-muted', description: 'Typing text and dot color.' },
    { name: '--mth-color-accent', description: 'Active dot highlight color.' },
  ],
};
