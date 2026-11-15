import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { accordionItemMessages } from './accordion-item.messages.js';

export const accordionItemSpec: ComponentBehaviorSpec = {
  tag: 'mth-accordion-item',
  package: '@methane/ui',
  conformance: [],
  controllers: ['MotionController'],
  focusModel: 'delegates-focus',
  states: ['expanded', 'disabled'],
  keyboard: [
    { key: 'Enter', when: 'focus is on item trigger', expect: 'toggles panel expansion' },
    { key: ' ', when: 'focus is on item trigger', expect: 'toggles panel expansion' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'heading', attr: 'heading', type: 'string', default: '' },
    { name: 'expanded', attr: 'expanded', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
  ],
  events: [
    {
      name: 'mth-toggle',
      cancelable: true,
      detailType: '{ value: string; expanded: boolean }',
    },
    { name: 'mth-open', cancelable: true, detailType: 'void' },
    { name: 'mth-after-open', cancelable: false, detailType: 'void' },
    { name: 'mth-close', cancelable: true, detailType: 'void' },
    { name: 'mth-after-close', cancelable: false, detailType: 'void' },
  ],
  slots: [
    { name: 'header', description: 'Optional custom trigger heading content.' },
    { name: '', description: 'Collapsible panel body content.' },
  ],
  parts: [
    { name: 'base', description: 'Root accordion item container.' },
    { name: 'header', description: 'Heading wrapper around the trigger button.' },
    { name: 'trigger', description: 'Native `<button>` with `aria-expanded` and `aria-controls`.' },
    { name: 'heading', description: 'Heading label span.' },
    { name: 'indicator', description: 'Chevron indicator rotating when expanded.' },
    { name: 'panel', description: 'Collapsible `role="region"` panel with `aria-labelledby`.' },
    { name: 'content', description: 'Inner panel content wrapper.' },
  ],
  messages: { ...accordionItemMessages },
};

export const CEM_METADATA = {
  description:
    'Disclosure section inside `<mth-accordion>` with same-root `button[aria-expanded][aria-controls]` and `role="region"` panel animated via `MotionController`.',
  propDescriptions: {
    value: 'Unique item identifier within `<mth-accordion>`.',
    heading: 'Plain-text trigger heading when not using the `header` slot.',
    expanded: 'Whether the accordion panel is expanded.',
    disabled: 'Disables toggling the accordion item.',
  },
  eventDescriptions: {
    'mth-toggle': 'Cancelable event emitted when the trigger button is activated.',
    'mth-open': 'Cancelable event emitted before the panel opens.',
    'mth-after-open': 'Emitted after panel entry transition completes.',
    'mth-close': 'Cancelable event emitted before the panel closes.',
    'mth-after-close': 'Emitted after panel exit transition completes.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Accordion item surface background.' },
    { name: '--mth-color-border', description: 'Accordion item divider border color.' },
    { name: '--mth-color-bg-subtle', description: 'Trigger hover background color.' },
  ],
};
