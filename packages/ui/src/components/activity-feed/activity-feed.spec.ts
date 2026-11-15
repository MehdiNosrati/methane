import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const activityFeedSpec: ComponentBehaviorSpec = {
  tag: 'mth-activity-feed',
  package: '@methane/ui',
  conformance: ['data-consumer'],
  controllers: ['DataController', 'SlotCollectionController'],
  focusModel: 'none',
  role: 'feed',
  states: ['loading', 'empty', 'error'],
  keyboard: [],
  props: [
    { name: 'items', attr: false, type: 'ReadonlyArray<ActivityFeedEntry> | null', default: null },
    { name: 'dataSource', attr: false, type: 'DataSource<ActivityFeedEntry, string> | null', default: null },
    { name: 'filter', attr: 'filter', type: 'string', default: '' },
    { name: 'relativeTime', attr: 'relative-time', type: 'boolean', default: true },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'emptyText', attr: 'empty-text', type: 'string', default: '' },
    { name: 'errorText', attr: 'error-text', type: 'string', default: '' },
    { name: 'loadingText', attr: 'loading-text', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-data-state',
      cancelable: false,
      detailType: '{ status: DataControllerStatus; count: number }',
    },
  ],
  slots: [
    { name: '', description: 'Declarative Light-DOM feed item elements.' },
    { name: 'loading', description: 'Custom loading state template.' },
    { name: 'empty', description: 'Custom empty state template.' },
    { name: 'error', description: 'Custom error state template.' },
  ],
  parts: [
    { name: 'base', description: 'Outer feed container (`role="feed"`).' },
    { name: 'item', description: 'Rendered activity entry (`role="article"`).' },
    { name: 'actor', description: 'Activity actor/author name.' },
    { name: 'title', description: 'Activity summary text.' },
    { name: 'timestamp', description: 'Formatted timestamp.' },
    { name: 'description', description: 'Secondary activity detail.' },
    { name: 'status', description: 'Loading, empty, or error status container.' },
    { name: 'retry', description: 'Retry action button rendered in error state.' },
  ],
  messages: {
    feedLabel: 'Activity feed',
    loadingText: 'Loading activity…',
    emptyText: 'No recent activity',
    errorText: 'Unable to load activity',
    retryLabel: 'Retry',
  },
};

export const CEM_METADATA = {
  description: 'Accessible activity stream (`role="feed"`) supporting slotted items, imperative `.items`, and async `DataSource<T>` via `DataController` and `SlotCollectionController`.',
  propDescriptions: {
    items: 'Imperative activity entries array.',
    dataSource: 'Async `DataSource<ActivityFeedEntry, string>` backing the feed.',
    filter: 'Filter string passed to `DataController` queries.',
    relativeTime: 'Formats timestamps using `FormattingUtils.formatRelativeTime`.',
    label: 'Accessible label for the `role="feed"` region.',
    emptyText: 'Custom empty-state message.',
    errorText: 'Custom error-state message.',
    loadingText: 'Custom loading-state message.',
  },
  eventDescriptions: {
    'mth-data-state': 'Emitted when the underlying `DataController` transitions status.',
  },
  cssProperties: [
    { name: '--mth-color-border', description: 'Divider border between feed items.' },
    { name: '--mth-color-fg-muted', description: 'Timestamp and description color.' },
  ],
};
