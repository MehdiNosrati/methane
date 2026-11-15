import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const paginationSpec: ComponentBehaviorSpec = {
  tag: 'mth-pagination',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['disabled'],
  keyboard: [
    { key: 'Enter', when: 'Page, previous, or next button is focused', expect: 'Navigates to the target page and emits mth-change' },
    { key: ' ', when: 'Page, previous, or next button is focused', expect: 'Navigates to the target page and emits mth-change' },
  ],
  props: [
    { name: 'page', attr: 'page', type: 'number', default: 1 },
    { name: 'totalPages', attr: 'total-pages', type: 'number', default: 1 },
    { name: 'siblingCount', attr: 'sibling-count', type: 'number', default: 1 },
    { name: 'boundaryCount', attr: 'boundary-count', type: 'number', default: 1 },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: true,
      detailType: '{ page: number }',
    },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Semantic `<nav>` landmark container.' },
    { name: 'list', description: 'Ordered list of pagination controls.' },
    { name: 'prev', description: 'Previous page button.' },
    { name: 'next', description: 'Next page button.' },
    { name: 'page', description: 'Individual numbered page button.' },
    { name: 'ellipsis', description: 'Ellipsis separator indicator.' },
  ],
  messages: {
    paginationLabel: 'Pagination',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    pageLabel: 'Page {page}',
  },
};

export const CEM_METADATA = {
  description: 'Accessible numbered pagination landmark with localized labels, ellipsis collapsing, and `aria-current="page"`.',
  propDescriptions: {
    page: 'Current 1-indexed active page.',
    totalPages: 'Total number of available pages.',
    siblingCount: 'Number of sibling pages rendered around the active page.',
    boundaryCount: 'Number of boundary pages pinned at the start and end.',
    disabled: 'Disables all pagination buttons.',
    label: 'Custom accessible `aria-label` for `<nav>`.',
  },
  eventDescriptions: {
    'mth-change': 'Emitted when the active page changes.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Active page button background color.' },
    { name: '--mth-color-border', description: 'Button border color.' },
  ],
};
