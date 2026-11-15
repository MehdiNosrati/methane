import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { siteSearchMessages } from './site-search.messages.js';

export interface SiteSearchItem {
  readonly id: string;
  readonly label: string;
  readonly href?: string;
  readonly category?: string;
  readonly snippet?: string;
}

export const EMPTY_SITE_SEARCH_ITEMS: ReadonlyArray<SiteSearchItem> = Object.freeze([]);

export const siteSearchSpec: ComponentBehaviorSpec = {
  tag: 'mth-site-search',
  package: '@methane-ui/ui',
  conformance: ['data-consumer', 'overlay', 'listbox'],
  controllers: ['DataController', 'ListboxController', 'OverlayController', 'PositioningController', 'HotkeyController'],
  focusModel: 'delegates-focus',
  states: ['open', 'loading', 'empty', 'error'],
  keyboard: [
    { key: 'ArrowDown', when: 'input focused', expect: 'opens results and activates next result' },
    { key: 'ArrowUp', when: 'input focused', expect: 'activates previous result' },
    { key: 'Enter', when: 'result active', expect: 'emits mth-select and closes popup' },
    { key: 'Escape', when: 'popup open', expect: 'closes popup' },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'query', attr: 'query', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'shortcut', attr: 'shortcut', type: 'string', default: '/' },
    { name: 'registerShortcut', attr: 'register-shortcut', type: 'boolean', default: false },
    { name: 'forceFallback', attr: 'force-fallback', type: 'boolean', default: false },
    {
      name: 'items',
      attr: false,
      type: 'ReadonlyArray<SiteSearchItem>',
      default: EMPTY_SITE_SEARCH_ITEMS,
    },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'void' },
    { name: 'mth-close', cancelable: true, detailType: 'void' },
    { name: 'mth-query-change', cancelable: false, detailType: '{ query: string }' },
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ id: string; label: string; href?: string }',
    },
  ],
  slots: [
    { name: 'leading', description: 'Optional leading icon before the search input.' },
    { name: 'empty', description: 'Custom empty-state content.' },
    { name: 'error', description: 'Custom error-state content.' },
  ],
  parts: [
    { name: 'combobox', description: 'Search input wrapper container.' },
    { name: 'input', description: 'Combobox `<input>` control.' },
    { name: 'popup', description: 'Positioned `[popover]` results container.' },
    { name: 'listbox', description: '`role="listbox"` container of matching results.' },
    { name: 'option', description: 'Selectable `role="option"` search result row.' },
    { name: 'category', description: 'Optional result category badge.' },
    { name: 'status', description: 'Loading, empty, or error status container.' },
  ],
  messages: { ...siteSearchMessages },
};

export const CEM_METADATA = {
  description:
    'Async site search combobox backed by `DataController`, `ListboxController`, positioned `[popover]` results overlay, and optional keyboard focus shortcut.',
  propDescriptions: {
    open: 'Controls visibility of the search results popup.',
    query: 'Current search query string.',
    label: 'Accessible label override for the search input.',
    placeholder: 'Placeholder override for the search input.',
    shortcut: 'Global hotkey that focuses the search input when not inside an editable control.',
    registerShortcut: 'Enables the document focus shortcut listener.',
    forceFallback: 'Forces JS fallback overlay/positioning instead of native `[popover]`.',
    items: 'Local fallback items searched when no external `dataSource` is provided.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event dispatched before the search results popup opens.',
    'mth-close': 'Cancelable event dispatched before the search results popup closes.',
    'mth-query-change': 'Dispatched when the user edits the search query.',
    'mth-select': 'Dispatched when a search result option is selected.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Input and popup surface background.' },
    { name: '--mth-color-bg-subtle', description: 'Hovered or active result background.' },
    { name: '--mth-color-fg', description: 'Primary text color.' },
    { name: '--mth-color-fg-muted', description: 'Muted category and status color.' },
    { name: '--mth-color-border', description: 'Combobox and popup border color.' },
    { name: '--mth-color-accent', description: 'Focus outline color.' },
    { name: '--mth-color-danger', description: 'Error status foreground color.' },
    { name: '--mth-radius-md', description: 'Combobox, popup, and option radius.' },
    { name: '--mth-space-2', description: 'Compact gap and padding.' },
    { name: '--mth-space-3', description: 'Input inline padding.' },
    { name: '--mth-shadow-md', description: 'Results popup shadow.' },
    { name: '--mth-font-size-md', description: 'Search input font size.' },
    { name: '--mth-font-size-sm', description: 'Option and status font size.' },
    { name: '--mth-z-index-popover', description: 'Popup z-index.' },
  ],
};
