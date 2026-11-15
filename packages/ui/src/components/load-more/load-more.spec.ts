import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const loadMoreSpec: ComponentBehaviorSpec = {
  tag: 'mth-load-more',
  package: '@methane/ui',
  conformance: ['data-consumer'],
  controllers: ['DataController'],
  focusModel: 'delegates-focus',
  states: ['loading', 'complete', 'disabled', 'error', 'empty'],
  keyboard: [
    {
      key: 'Enter',
      when: 'Load-more or retry button is focused',
      expect: 'Triggers loading the next page of items',
    },
    {
      key: 'Space',
      when: 'Load-more or retry button is focused',
      expect: 'Triggers loading the next page of items',
    },
  ],
  props: [
    { name: 'loading', attr: 'loading', type: 'boolean', default: false },
    { name: 'complete', attr: 'complete', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'loadedCount', attr: 'loaded-count', type: 'number', default: 0 },
    { name: 'totalCount', attr: 'total-count', type: 'number', default: 0 },
    { name: 'dataSource', attr: false, type: 'DataSource<T> | null', default: null },
    { name: 'renderItem', attr: false, type: '(item: T, index: number) => unknown', default: undefined },
  ],
  events: [
    {
      name: 'mth-load-more',
      cancelable: true,
      detailType: '{ cursor: string | null }',
    },
  ],
  slots: [
    { name: '', description: 'Custom rendered items when managed externally.' },
    { name: 'label', description: 'Custom button label for loading more items.' },
    { name: 'loading', description: 'Custom loading indicator.' },
    { name: 'complete', description: 'Custom completion message.' },
    { name: 'empty', description: 'Custom empty-state content.' },
    { name: 'error', description: 'Custom error fallback content.' },
  ],
  parts: [
    { name: 'base', description: 'Root container.' },
    { name: 'list', description: 'Items list container.' },
    { name: 'item', description: 'Rendered item container when driven by `DataController`.' },
    { name: 'progress', description: 'Loaded vs total item count summary.' },
    { name: 'status', description: 'Polite live status readout.' },
    { name: 'button', description: 'Primary load-more action button.' },
    { name: 'retry', description: 'Retry button shown when loading fails.' },
  ],
  messages: {
    regionLabel: 'Load more results',
    loadMore: 'Load more',
    loading: 'Loading…',
    complete: 'All items loaded',
    error: 'Failed to load items',
    retry: 'Retry',
    empty: 'No items available',
  },
};

export const CEM_METADATA = {
  description:
    'Explicit load-more pagination control integrating `DataController` cursor appending, progress summary, error retry, and standalone cancelable `mth-load-more` dispatch.',
  propDescriptions: {
    loading: 'Reflects or forces the loading state.',
    complete: 'Marks the collection as fully loaded.',
    disabled: 'Prevents manual load-more and retry triggers.',
    loadedCount: 'Optional explicit count of currently loaded items when not bound to `dataSource`.',
    totalCount: 'Optional explicit total count of items when not bound to `dataSource`.',
    dataSource: 'Optional `DataSource<T>` connected to `DataController`.',
    renderItem: 'Optional custom renderer for items returned by `DataController`.',
  },
  eventDescriptions: {
    'mth-load-more': 'Cancelable event emitted when the user activates load-more or retry.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Button background color.' },
    { name: '--mth-color-border', description: 'Button border color.' },
    { name: '--mth-color-fg', description: 'Primary text color.' },
    { name: '--mth-color-fg-muted', description: 'Progress and status text color.' },
  ],
};
