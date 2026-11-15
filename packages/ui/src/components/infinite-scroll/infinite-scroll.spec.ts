import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const infiniteScrollSpec: ComponentBehaviorSpec = {
  tag: 'mth-infinite-scroll',
  package: '@methane/ui',
  conformance: ['data-consumer'],
  controllers: ['ObserverPoolController', 'DataController'],
  focusModel: 'delegates-focus',
  states: ['loading', 'complete', 'disabled', 'error', 'empty'],
  keyboard: [
    {
      key: 'Enter',
      when: 'Load-more or retry fallback button is focused',
      expect: 'Triggers loading the next batch of items',
    },
  ],
  props: [
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'complete', attr: 'complete', type: 'boolean', default: false },
    { name: 'autoLoad', attr: 'auto-load', type: 'boolean', default: true },
    { name: 'threshold', attr: 'threshold', type: 'number', default: 0.1 },
    { name: 'rootMargin', attr: 'root-margin', type: 'string', default: '100px' },
    { name: 'dataSource', attr: '', type: 'DataSource<T> | null', default: null },
    { name: 'renderItem', attr: '', type: '(item: T, index: number) => unknown', default: undefined },
  ],
  events: [
    {
      name: 'mth-load-more',
      cancelable: true,
      detailType: '{ cursor: string | null }',
    },
  ],
  slots: [
    { name: '', description: 'Custom rendered list items when `dataSource` is managed externally.' },
    { name: 'loading', description: 'Custom loading indicator.' },
    { name: 'complete', description: 'Custom completion message.' },
    { name: 'empty', description: 'Custom empty-state content.' },
    { name: 'error', description: 'Custom error fallback content.' },
  ],
  parts: [
    { name: 'base', description: 'Root container.' },
    { name: 'list', description: 'Items container.' },
    { name: 'item', description: 'Rendered item container when driven by `DataController`.' },
    { name: 'sentinel', description: 'IntersectionObserver sentinel element.' },
    { name: 'status', description: 'Polite live status readout.' },
    { name: 'load-more', description: 'Accessible button fallback to load more items.' },
    { name: 'retry', description: 'Retry button shown in error state.' },
  ],
  messages: {
    regionLabel: 'Scrollable results',
    loadMore: 'Load more',
    loading: 'Loading more items…',
    complete: 'All items loaded',
    error: 'Failed to load items',
    retry: 'Retry',
    empty: 'No items found',
  },
};

export const CEM_METADATA = {
  description:
    'Infinite scroll container combining `ObserverPoolController` IntersectionObserver sentinel observation, `DataController` cursor/cache orchestration, and an accessible button fallback.',
  propDescriptions: {
    disabled: 'Stops automatic intersection loading and disables manual fallback triggers.',
    complete: 'Marks the stream as having no further items.',
    autoLoad: 'Enables IntersectionObserver-driven automatic loading.',
    threshold: 'IntersectionObserver threshold (`0..1`) for triggering `loadMore()`.',
    rootMargin: 'IntersectionObserver `rootMargin` string.',
    dataSource: 'Optional `DataSource<T>` connected to `DataController`.',
    renderItem: 'Optional custom renderer for items returned by `DataController`.',
  },
  eventDescriptions: {
    'mth-load-more': 'Cancelable event emitted when requesting the next page/cursor.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Container surface background.' },
    { name: '--mth-color-border', description: 'Fallback button border color.' },
  ],
};
