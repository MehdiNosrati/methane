import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { skeletonMessages } from './skeleton.messages.js';

export const skeletonSpec: ComponentBehaviorSpec = {
  tag: 'mth-skeleton',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['animated'],
  keyboard: [],
  props: [
    {
      name: 'variant',
      attr: 'variant',
      type: "'text' | 'circular' | 'rectangular'",
      default: 'text',
    },
    { name: 'lines', attr: 'lines', type: 'number', default: 1 },
    { name: 'animated', attr: 'animated', type: 'boolean', default: true },
  ],
  events: [],
  slots: [],
  parts: [
    { name: 'base', description: 'Decorative `aria-hidden="true"` skeleton wrapper.' },
    { name: 'line', description: 'Individual skeleton shape or text line.' },
  ],
  messages: { ...skeletonMessages },
};

export const CEM_METADATA = {
  description:
    'Decorative loading placeholder (`aria-hidden="true"`) supporting text lines, circular, and rectangular variants via CSS custom properties.',
  propDescriptions: {
    variant: 'Placeholder geometry (`text | circular | rectangular`).',
    lines: 'Number of placeholder lines rendered when `variant="text"`.',
    animated: 'Enables shimmer/pulse animation (disabled automatically under `prefers-reduced-motion: reduce`).',
  },
  cssProperties: [
    { name: '--mth-skeleton-width', description: 'Custom inline size for the skeleton shape.' },
    { name: '--mth-skeleton-height', description: 'Custom block size for the skeleton shape.' },
    { name: '--mth-color-bg-subtle', description: 'Base skeleton surface color.' },
    { name: '--mth-radius-sm', description: 'Text line corner radius.' },
    { name: '--mth-radius-md', description: 'Rectangular skeleton corner radius.' },
  ],
};
