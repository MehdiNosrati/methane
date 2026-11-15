import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export interface ErrorSummaryItem {
  readonly id?: string;
  readonly fieldId?: string;
  readonly href?: string;
  readonly name?: string;
  readonly message: string;
  readonly label?: string;
}

export const EMPTY_ERROR_SUMMARY_ITEMS: ReadonlyArray<ErrorSummaryItem> = Object.freeze([]);

export const errorSummarySpec: ComponentBehaviorSpec = {
  tag: 'mth-error-summary',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: ['LiveAnnouncer'],
  focusModel: 'delegates-focus',
  states: ['empty'],
  keyboard: [
    {
      key: 'Enter',
      when: 'focus on error link',
      expect: 'focuses target control and emits mth-focus-field',
    },
  ],
  props: [
    { name: 'heading', attr: 'heading', type: 'string', default: '' },
    { name: 'autofocus', attr: 'autofocus', type: 'boolean', default: false },
    {
      name: 'errors',
      attr: false,
      type: 'ReadonlyArray<{ readonly id?: string; readonly fieldId?: string; readonly href?: string; readonly name?: string; readonly message: string; readonly label?: string }>',
      default: EMPTY_ERROR_SUMMARY_ITEMS,
    },
  ],
  events: [
    {
      name: 'mth-focus-field',
      cancelable: false,
      detailType: '{ id: string; name: string; message: string; href: string }',
    },
  ],
  slots: [
    { name: '', description: 'Custom error summary items appended below the heading.' },
    { name: 'heading', description: 'Optional custom summary heading.' },
  ],
  parts: [
    { name: 'summary', description: 'Focusable `role="alert"` summary region.' },
    { name: 'title', description: 'Pluralized error summary heading.' },
    { name: 'list', description: 'Unordered list of interactive error links.' },
    { name: 'item', description: 'Individual list item wrapping an error link.' },
    { name: 'link', description: 'Anchor navigating focus to the invalid control.' },
  ],
  messages: {
    titleOne: 'There is {count} problem',
    titleOther: 'There are {count} problems',
    emptyTitle: 'No problems found',
    announcement: '{title}: {first}',
  },
};

export const CEM_METADATA = {
  description:
    'Accessible form validation error summary with focusable role="alert" container, LiveAnnouncer support, and pluralized headings.',
  propDescriptions: {
    heading: 'Optional custom heading overriding the default pluralized error count title.',
    autofocus: 'Automatically moves focus to the summary alert when errors appear.',
    errors: 'Array of validation error descriptors rendered as links to target controls.',
  },
  eventDescriptions: {
    'mth-focus-field': 'Fired when a user activates an error link to navigate to a field.',
  },
  cssProperties: [
    { name: '--mth-color-danger', description: 'Summary border, heading, and link color.' },
    { name: '--mth-color-danger-subtle', description: 'Summary region background tint.' },
    { name: '--mth-color-fg', description: 'Primary body text color.' },
    { name: '--mth-color-border-focus', description: 'Focus outline color.' },
    { name: '--mth-radius-md', description: 'Summary container corner radius.' },
  ],
};
