import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { tocMessages } from './toc.messages.js';

export interface TocItem {
  readonly id: string;
  readonly label: string;
  readonly level?: number;
  readonly href?: string;
}

export const EMPTY_TOC_ITEMS: ReadonlyArray<TocItem> = Object.freeze([]);

export const tocSpec: ComponentBehaviorSpec = {
  tag: 'mth-toc',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: ['ObserverPoolController'],
  focusModel: 'delegates-focus',
  states: [],
  keyboard: [],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'heading', attr: 'heading', type: 'string', default: '' },
    { name: 'activeId', attr: 'active-id', type: 'string', default: '' },
    { name: 'targetSelector', attr: 'target-selector', type: 'string', default: '' },
    { name: 'items', attr: false, type: 'ReadonlyArray<TocItem>', default: EMPTY_TOC_ITEMS },
  ],
  events: [
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ id: string; label: string; href: string }',
    },
    {
      name: 'mth-active-change',
      cancelable: false,
      detailType: '{ id: string }',
    },
  ],
  slots: [{ name: 'heading', description: 'Optional custom heading slot above the TOC list.' }],
  parts: [
    { name: 'nav', description: 'Semantic `<nav>` landmark.' },
    { name: 'heading', description: 'Optional table of contents heading.' },
    { name: 'list', description: 'Ordered `<ol>` list of heading links.' },
    { name: 'item', description: 'Individual `<li>` entry.' },
    { name: 'link', description: 'Anchor `<a href="#...">` link with `aria-current="location"` when active.' },
  ],
  messages: { ...tocMessages },
};

export const CEM_METADATA = {
  description:
    'Table of contents navigation landmark that tracks active visible headings using `ObserverPoolController.observeIntersection`.',
  propDescriptions: {
    label: 'Accessible label for the `<nav>` landmark.',
    heading: 'Visible section title above the list.',
    activeId: 'ID of the currently active heading highlighted with `aria-current="location"`.',
    targetSelector: 'Optional CSS selector to auto-discover headings with `id` attributes from the document.',
    items: 'Structured heading items when provided explicitly instead of `targetSelector`.',
  },
  eventDescriptions: {
    'mth-select': 'Fired when a TOC link is activated.',
    'mth-active-change': 'Fired when intersection tracking or selection changes the active heading.',
  },
  cssProperties: [
    { name: '--mth-color-fg', description: 'Active and heading text color.' },
    { name: '--mth-color-fg-muted', description: 'Inactive link text color.' },
    { name: '--mth-color-border', description: 'Track guide border color.' },
    { name: '--mth-color-accent', description: 'Active link indicator and text color.' },
    { name: '--mth-font-size-sm', description: 'Link font size.' },
    { name: '--mth-space-2', description: 'Link padding and item spacing.' },
  ],
};
