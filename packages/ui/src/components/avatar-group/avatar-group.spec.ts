import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { avatarGroupMessages } from './avatar-group.messages.js';

export const avatarGroupSpec: ComponentBehaviorSpec = {
  tag: 'mth-avatar-group',
  package: '@methane/ui',
  conformance: [],
  controllers: ['SlotCollectionController'],
  focusModel: 'none',
  states: ['overflowing'],
  keyboard: [],
  props: [
    { name: 'max', attr: 'max', type: 'number', default: 0 },
    {
      name: 'size',
      attr: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
      default: 'md',
    },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [],
  slots: [
    { name: '', description: 'Slotted `<mth-avatar>` elements.' },
  ],
  parts: [
    { name: 'base', description: 'Root avatar group container with `role="group"`.' },
    { name: 'overflow', description: 'Localized `+N` overflow badge rendered when avatars exceed `max`.' },
  ],
  messages: { ...avatarGroupMessages },
};

export const CEM_METADATA = {
  description:
    'Overlapping stack of `<mth-avatar>` items managed via `SlotCollectionController` with `max` truncation and localized `+N` overflow badge.',
  propDescriptions: {
    max: 'Maximum visible avatars before truncating into a `+N` overflow badge (`0` shows all).',
    size: 'Shared size scale forwarded to slotted avatars (`xs | sm | md | lg | xl`).',
    label: 'Accessible group label; defaults to localized `"Avatar group"`.',
  },
  cssProperties: [
    { name: '--mth-color-bg-subtle', description: 'Overflow badge background color.' },
    { name: '--mth-color-fg', description: 'Overflow badge text color.' },
    { name: '--mth-color-surface', description: 'Ring border separating stacked avatars.' },
  ],
};
