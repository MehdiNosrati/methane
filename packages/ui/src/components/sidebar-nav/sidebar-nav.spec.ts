import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { sidebarNavMessages } from './sidebar-nav.messages.js';

export interface SidebarNavItem {
  readonly id?: string;
  readonly value: string;
  readonly label: string;
  readonly href?: string;
  readonly disabled?: boolean;
  readonly badge?: string;
  readonly group?: string;
}

export const EMPTY_SIDEBAR_NAV_ITEMS: ReadonlyArray<SidebarNavItem> = Object.freeze([]);

export const sidebarNavSpec: ComponentBehaviorSpec = {
  tag: 'mth-sidebar-nav',
  package: '@methane/ui',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['collapsed'],
  keyboard: [
    { key: 'ArrowDown', when: 'focused on item', expect: 'moves focus to next enabled item' },
    { key: 'ArrowUp', when: 'focused on item', expect: 'moves focus to previous enabled item' },
    { key: 'Home', when: 'focused on item', expect: 'moves focus to first enabled item' },
    { key: 'End', when: 'focused on item', expect: 'moves focus to last enabled item' },
  ],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'collapsed', attr: 'collapsed', type: 'boolean', default: false },
    { name: 'collapsible', attr: 'collapsible', type: 'boolean', default: false },
    { name: 'activeValue', attr: 'active-value', type: 'string', default: '' },
    { name: 'activeHref', attr: 'active-href', type: 'string', default: '' },
    {
      name: 'items',
      attr: false,
      type: 'ReadonlyArray<SidebarNavItem>',
      default: EMPTY_SIDEBAR_NAV_ITEMS,
    },
  ],
  events: [
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ value: string; href?: string; label: string }',
    },
    {
      name: 'mth-collapse-change',
      cancelable: false,
      detailType: '{ collapsed: boolean }',
    },
  ],
  slots: [
    { name: 'header', description: 'Optional top header or brand slot.' },
    { name: '', description: 'Fallback slotted navigation items when items array is empty.' },
    { name: 'footer', description: 'Optional sticky footer slot.' },
  ],
  parts: [
    { name: 'base', description: 'Outer sidebar container.' },
    { name: 'header', description: 'Header row with optional collapse toggle.' },
    { name: 'toggle', description: 'Sidebar collapse/expand button.' },
    { name: 'nav', description: 'Semantic `<nav>` landmark.' },
    { name: 'list', description: 'Vertical navigation list.' },
    { name: 'group-label', description: 'Section group heading.' },
    { name: 'item', description: 'Interactive navigation link or button.' },
    { name: 'badge', description: 'Optional item badge.' },
    { name: 'footer', description: 'Bottom sidebar footer area.' },
  ],
  messages: { ...sidebarNavMessages },
};

export const CEM_METADATA = {
  description:
    'Collapsible vertical navigation landmark with roving focus keyboard navigation, grouped items, and safe href validation.',
  propDescriptions: {
    label: 'Accessible label for the `<nav>` landmark.',
    collapsed: 'Collapses the sidebar into compact rail mode.',
    collapsible: 'Displays a collapse/expand toggle button in the header.',
    activeValue: 'Currently active item value marked with `aria-current="page"`.',
    activeHref: 'Currently active item href marked with `aria-current="page"`.',
    items: 'Structured array of navigation items with optional group headings.',
  },
  eventDescriptions: {
    'mth-select': 'Fired when a navigation item is activated.',
    'mth-collapse-change': 'Fired when the collapsed state toggles.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Sidebar container surface background.' },
    { name: '--mth-color-fg', description: 'Primary foreground text color.' },
    { name: '--mth-color-fg-muted', description: 'Muted group heading and icon color.' },
    { name: '--mth-color-border', description: 'Sidebar divider border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring outline color.' },
    { name: '--mth-color-accent-subtle', description: 'Active item background highlight.' },
    { name: '--mth-color-accent-fg', description: 'Active item foreground color.' },
    { name: '--mth-radius-md', description: 'Item and container corner radius.' },
  ],
};
