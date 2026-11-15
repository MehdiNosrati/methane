import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { badgeMessages } from './badge.messages.js';

export const badgeSpec: ComponentBehaviorSpec = {
  tag: 'mth-badge',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['pill', 'dot'],
  keyboard: [],
  props: [
    {
      name: 'variant',
      attr: 'variant',
      type: "'neutral' | 'accent' | 'success' | 'warning' | 'danger'",
      default: 'neutral',
    },
    {
      name: 'size',
      attr: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: 'md',
    },
    { name: 'pill', attr: 'pill', type: 'boolean', default: false },
    { name: 'dot', attr: 'dot', type: 'boolean', default: false },
  ],
  events: [],
  slots: [
    { name: '', description: 'Badge label or count text (hidden when `dot` is true).' },
  ],
  parts: [
    { name: 'base', description: 'Root badge container.' },
    { name: 'dot', description: 'Compact dot indicator shown when `dot` is true.' },
    { name: 'label', description: 'Slotted label wrapper.' },
  ],
  messages: { ...badgeMessages },
};

export const CEM_METADATA = {
  description: 'Compact status, count, or category indicator badge with variant, size, pill, and dot modes.',
  propDescriptions: {
    variant: 'Semantic color variant (`neutral | accent | success | warning | danger`).',
    size: 'Visual badge size scale (`sm | md | lg`).',
    pill: 'Applies fully rounded pill corners.',
    dot: 'Renders as a compact status dot indicator without text.',
  },
  cssProperties: [
    { name: '--mth-color-bg-subtle', description: 'Neutral badge background color.' },
    { name: '--mth-color-accent-subtle', description: 'Accent badge background color.' },
    { name: '--mth-color-success-subtle', description: 'Success badge background color.' },
    { name: '--mth-color-warning-subtle', description: 'Warning badge background color.' },
    { name: '--mth-color-danger-subtle', description: 'Danger badge background color.' },
    { name: '--mth-radius-sm', description: 'Default badge corner radius.' },
    { name: '--mth-radius-full', description: 'Pill badge corner radius.' },
  ],
};
