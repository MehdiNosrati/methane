import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { bottomNavMessages } from './bottom-nav.messages.js';

export interface BottomNavItem {
  readonly value: string;
  readonly label: string;
  readonly href?: string;
  readonly badge?: string;
  readonly disabled?: boolean;
}

export const EMPTY_BOTTOM_NAV_ITEMS: ReadonlyArray<BottomNavItem> = Object.freeze([]);

export const bottomNavSpec: ComponentBehaviorSpec = {
  tag: 'mth-bottom-nav',
  package: '@methane/ui',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'delegates-focus',
  states: [],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'item focused', expect: 'moves focus to next enabled item' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'item focused', expect: 'moves focus to next enabled item' },
    { key: 'Home', when: 'item focused', expect: 'moves focus to first enabled item' },
    { key: 'End', when: 'item focused', expect: 'moves focus to last enabled item' },
  ],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'activeValue', attr: 'active-value', type: 'string', default: '' },
    { name: 'activeHref', attr: 'active-href', type: 'string', default: '' },
    { name: 'fixed', attr: 'fixed', type: 'boolean', default: true },
    {
      name: 'items',
      attr: false,
      type: 'ReadonlyArray<BottomNavItem>',
      default: EMPTY_BOTTOM_NAV_ITEMS,
    },
  ],
  events: [
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ value: string; label: string; href?: string }',
    },
  ],
  slots: [],
  parts: [
    { name: 'nav', description: 'Semantic `<nav>` landmark.' },
    { name: 'list', description: 'Horizontal bar list container.' },
    { name: 'item', description: 'Interactive bottom nav link or button.' },
    { name: 'badge', description: 'Optional notification badge.' },
  ],
  messages: { ...bottomNavMessages },
};

export const CEM_METADATA = {
  description:
    'Mobile-friendly viewport bottom navigation bar with horizontal roving focus, `aria-current="page"`, badges, and safe URL validation.',
  propDescriptions: {
    label: 'Accessible label for the `<nav>` landmark.',
    activeValue: 'Value of the currently active destination.',
    activeHref: 'Href of the currently active destination.',
    fixed: 'Pins the bar to the bottom of the viewport via `position: fixed`.',
    items: 'Navigation destinations rendered in the bottom bar.',
  },
  eventDescriptions: {
    'mth-select': 'Fired when a bottom navigation item is activated.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Bottom bar surface background.' },
    { name: '--mth-color-fg', description: 'Default item text color.' },
    { name: '--mth-color-fg-muted', description: 'Inactive item text color.' },
    { name: '--mth-color-border', description: 'Top bar hairline border color.' },
    { name: '--mth-color-accent', description: 'Active item text and focus color.' },
    { name: '--mth-color-danger', description: 'Badge highlight color.' },
    { name: '--mth-font-size-sm', description: 'Item label font size.' },
    { name: '--mth-z-index-sticky', description: 'Fixed bottom bar z-index.' },
  ],
};
