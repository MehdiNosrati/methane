import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { cardMessages } from './card.messages.js';

export const cardSpec: ComponentBehaviorSpec = {
  tag: 'mth-card',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['interactive'],
  keyboard: [],
  props: [
    {
      name: 'variant',
      attr: 'variant',
      type: "'elevated' | 'outlined' | 'subtle'",
      default: 'elevated',
    },
    { name: 'interactive', attr: 'interactive', type: 'boolean', default: false },
  ],
  events: [],
  slots: [
    { name: 'media', description: 'Optional top media container (image or banner).' },
    { name: 'header', description: 'Optional card header section.' },
    { name: '', description: 'Main card body content.' },
    { name: 'footer', description: 'Optional card footer actions or metadata.' },
  ],
  parts: [
    { name: 'base', description: 'Root card surface container.' },
    { name: 'media', description: 'Media slot wrapper.' },
    { name: 'header', description: 'Header slot wrapper.' },
    { name: 'body', description: 'Body content slot wrapper.' },
    { name: 'footer', description: 'Footer slot wrapper.' },
  ],
  messages: { ...cardMessages },
};

export const CEM_METADATA = {
  description:
    'Surface container card with `elevated`, `outlined`, and `subtle` variants, interactive affordances, and structured slots.',
  propDescriptions: {
    variant: 'Surface elevation and border style (`elevated | outlined | subtle`).',
    interactive: 'Applies interactive hover/focus-within affordances.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Elevated card surface background.' },
    { name: '--mth-color-bg-subtle', description: 'Subtle card surface background.' },
    { name: '--mth-color-border', description: 'Card hairline border color.' },
    { name: '--mth-radius-lg', description: 'Card corner radius.' },
    { name: '--mth-shadow-sm', description: 'Elevated card resting shadow.' },
    { name: '--mth-shadow-md', description: 'Interactive card hover shadow.' },
  ],
};
