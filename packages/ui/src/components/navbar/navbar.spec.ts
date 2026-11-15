import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const navbarSpec: ComponentBehaviorSpec = {
  tag: 'mth-navbar',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['open', 'sticky'],
  keyboard: [
    { key: 'Escape', when: 'Mobile disclosure drawer is open', expect: 'Closes mobile drawer and restores focus to toggle button' },
  ],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'sticky', attr: 'sticky', type: 'boolean', default: false },
  ],
  events: [
    {
      name: 'mth-open',
      cancelable: true,
      detailType: '{ open: true }',
    },
    {
      name: 'mth-close',
      cancelable: false,
      detailType: '{ open: false; reason: string }',
    },
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ open: boolean }',
    },
  ],
  slots: [
    { name: 'brand', description: 'Brand logo and title slot.' },
    { name: '', description: 'Primary desktop navigation links.' },
    { name: 'actions', description: 'Trailing action buttons or utilities.' },
    { name: 'mobile', description: 'Collapsible mobile disclosure drawer content.' },
  ],
  parts: [
    { name: 'base', description: 'Outer `<header>` landmark container.' },
    { name: 'inner', description: 'Responsive header bar row.' },
    { name: 'brand', description: 'Brand slot container.' },
    { name: 'nav', description: 'Primary `<nav>` landmark container.' },
    { name: 'actions', description: 'Actions slot container.' },
    { name: 'toggle', description: 'Mobile menu disclosure toggle button.' },
    { name: 'drawer', description: 'Collapsible mobile disclosure drawer.' },
  ],
  messages: {
    navbarLabel: 'Primary navigation',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
  },
};

export const CEM_METADATA = {
  description: 'Landmark application header and navigation bar with brand/nav/actions slots and accessible mobile disclosure.',
  propDescriptions: {
    label: 'Accessible label for the primary `<nav>` landmark.',
    open: 'Controls visibility of the collapsible mobile disclosure drawer.',
    sticky: 'Pins the navbar to the top of the viewport (`position: sticky`).',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before opening the mobile drawer.',
    'mth-close': 'Fired when the mobile drawer closes.',
    'mth-change': 'Fired whenever mobile drawer `open` state toggles.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Navbar background surface.' },
    { name: '--mth-color-border', description: 'Navbar bottom border color.' },
    { name: '--mth-z-index-sticky', description: 'Sticky positioning stacking order.' },
  ],
};
