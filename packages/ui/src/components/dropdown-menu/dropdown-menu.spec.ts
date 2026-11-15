import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { dropdownMenuMessages } from './dropdown-menu.messages.js';

export const dropdownMenuSpec: ComponentBehaviorSpec = {
  tag: 'mth-dropdown-menu',
  package: '@methane/ui',
  conformance: ['listbox', 'overlay', 'roving-focus'],
  controllers: [
    'ListboxController',
    'SlotCollectionController',
    'OverlayController',
    'PositioningController',
    'RovingFocusController',
  ],
  focusModel: 'none',
  states: ['open'],
  keyboard: [
    { key: 'ArrowDown', when: 'open', expect: 'moves active menu item down (wrapping at end)' },
    { key: 'ArrowUp', when: 'open', expect: 'moves active menu item up (wrapping at start)' },
    { key: 'Home', when: 'open', expect: 'focuses first enabled menu item' },
    { key: 'End', when: 'open', expect: 'focuses last enabled menu item' },
    { key: 'Enter', when: 'open and active item exists', expect: 'selects active item and emits mth-select' },
    { key: 'Escape', when: 'open', expect: 'closes menu and restores focus to trigger' },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'placement', attr: 'placement', type: 'string', default: 'bottom-start' },
    { name: 'offset', attr: 'offset', type: 'number', default: 6 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'closeOnSelect', attr: 'close-on-select', type: 'boolean', default: true },
    {
      name: 'roleMode',
      attr: 'role-mode',
      type: "'menu' | 'listbox'",
      default: 'menu',
    },
    { name: 'forceFallback', attr: 'force-fallback', type: 'boolean', default: false },
    {
      name: 'anchor',
      attr: false,
      type: 'Element | { getBoundingClientRect(): DOMRect } | DOMRect | null',
      default: null,
    },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'void' },
    { name: 'mth-after-open', cancelable: false, detailType: 'void' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: '{ reason: string }' },
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ value: string; checked: boolean }',
    },
  ],
  slots: [
    { name: '', description: 'Declarative `<mth-menu-item>` children.' },
    { name: 'trigger', description: 'Optional trigger element that toggles the dropdown menu.' },
  ],
  parts: [
    { name: 'anchor', description: 'Trigger wrapper slot container.' },
    { name: 'base', description: 'Positioned floating menu surface.' },
    { name: 'menu', description: 'Scrollable `[role="menu"]` or `[role="listbox"]` list container.' },
  ],
  messages: { ...dropdownMenuMessages },
};

export const CEM_METADATA = {
  description:
    'Anchored dropdown menu coordinating `<mth-menu-item>` children via roving focus, typeahead, dual-path positioning, and top-layer popover overlay.',
  propDescriptions: {
    open: 'Controls open visibility of the dropdown menu.',
    placement: 'Preferred placement relative to trigger.',
    offset: 'Pixel distance between trigger and menu surface.',
    label: 'Accessible label for the menu container.',
    closeOnSelect: 'Closes the menu automatically after selecting a normal/radio item.',
    roleMode: 'Switches internal container semantics between `menu` (default) and `listbox`.',
    forceFallback: 'Forces JS positioning and non-top-layer fallback mode.',
    anchor: 'Optional explicit Element, VirtualAnchor, or DOMRect positioning target.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before opening the menu.',
    'mth-after-open': 'Fired after opening completes.',
    'mth-close': 'Cancelable event fired before closing the menu.',
    'mth-after-close': 'Fired after closing completes and focus restores.',
    'mth-select': 'Fired when a menu item is activated with `{ value, checked }`.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Menu surface background.' },
    { name: '--mth-color-border', description: 'Menu surface border color.' },
    { name: '--mth-radius-md', description: 'Menu surface corner radius.' },
    { name: '--mth-shadow-lg', description: 'Menu surface elevation shadow.' },
  ],
};
