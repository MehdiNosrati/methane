import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const linkSpec: ComponentBehaviorSpec = {
  tag: 'mth-link',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['disabled', 'external'],
  keyboard: [
    { key: 'Enter', when: 'Enabled link is focused', expect: 'Activates the link and emits cancelable mth-press' },
  ],
  props: [
    { name: 'href', attr: 'href', type: 'string', default: '' },
    { name: 'target', attr: 'target', type: 'string', default: '' },
    { name: 'rel', attr: 'rel', type: 'string', default: '' },
    { name: 'external', attr: 'external', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'underline', attr: 'underline', type: "'always' | 'hover' | 'none'", default: 'always' },
  ],
  events: [
    {
      name: 'mth-press',
      cancelable: true,
      detailType: '{ originalEvent: Event }',
    },
  ],
  slots: [
    { name: '', description: 'Link text content.' },
    { name: 'prefix', description: 'Optional leading icon.' },
    { name: 'suffix', description: 'Optional trailing icon.' },
  ],
  parts: [
    { name: 'control', description: 'Native internal `<a>` element.' },
    { name: 'external-icon', description: 'Decorative external link indicator.' },
  ],
  messages: {
    opensNewTab: 'Opens in a new tab',
  },
};

export const CEM_METADATA = {
  description: 'Token-styled accessible hyperlink with automatic `noopener noreferrer` hardening and URL allowlist checks.',
  propDescriptions: {
    href: 'Destination URL (`https:`, `http:`, `mailto:`, `tel:`, or relative paths).',
    target: 'Link browsing context target.',
    rel: 'Relationship attribute; `_blank` targets automatically enforce `noopener noreferrer`.',
    external: 'Marks link as external, defaulting target to `_blank` when unset and displaying an indicator.',
    disabled: 'Marks the link `aria-disabled="true"`, omits `href`, and blocks activation.',
    underline: 'Underline behavior (`always`, `hover`, or `none`).',
  },
  eventDescriptions: {
    'mth-press': 'Cancelable event fired when an enabled link is activated.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Default link foreground color.' },
    { name: '--mth-color-accent-hover', description: 'Hovered link foreground color.' },
  ],
};
