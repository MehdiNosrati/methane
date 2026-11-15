import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { contextMenuMessages } from './context-menu.messages.js';

export interface ContextMenuItem {
  readonly id?: string;
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly shortcut?: string;
  readonly separator?: boolean;
  readonly children?: ReadonlyArray<ContextMenuItem>;
}

export const EMPTY_CONTEXT_MENU_ITEMS: ReadonlyArray<ContextMenuItem> = Object.freeze([]);

export const contextMenuSpec: ComponentBehaviorSpec = {
  tag: 'mth-context-menu',
  package: '@methane-ui/ui',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'PositioningController'],
  focusModel: 'delegates-focus',
  states: ['open'],
  keyboard: [
    { key: 'ArrowDown', when: 'open', expect: 'moves focus to next enabled menu item' },
    { key: 'ArrowUp', when: 'open', expect: 'moves focus to previous enabled menu item' },
    { key: 'ArrowRight', when: 'focused on item with submenu', expect: 'opens nested submenu' },
    { key: 'ArrowLeft', when: 'inside nested submenu', expect: 'closes nested submenu' },
    { key: 'Escape', when: 'open', expect: 'closes context menu and restores focus' },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'forceFallback', attr: 'force-fallback', type: 'boolean', default: false },
    {
      name: 'items',
      attr: false,
      type: 'ReadonlyArray<ContextMenuItem>',
      default: EMPTY_CONTEXT_MENU_ITEMS,
    },
  ],
  events: [
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ value: string; label: string }',
    },
    { name: 'mth-open', cancelable: true, detailType: 'void' },
    { name: 'mth-after-open', cancelable: false, detailType: 'void' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: '{ reason: string }' },
  ],
  slots: [
    { name: '', description: 'Target region whose right-click opens the context menu.' },
  ],
  parts: [
    { name: 'target', description: 'Wrapper around default slot capturing `contextmenu` events.' },
    { name: 'popup', description: 'Floating `[popover]` surface positioned at virtual pointer coordinates.' },
    { name: 'menu', description: 'Primary `[role="menu"]` action list.' },
    { name: 'item', description: 'Individual `[role="menuitem"]` action.' },
    { name: 'submenu', description: 'Nested `[role="menu"]` panel.' },
    { name: 'shortcut', description: 'Shortcut hint label.' },
    { name: 'separator', description: 'Visual separator between menu groups.' },
  ],
  messages: { ...contextMenuMessages },
};

export const CEM_METADATA = {
  description:
    'Right-click and programmatic virtual-anchor context menu with nested submenus and OverlayController top-layer fallback.',
  propDescriptions: {
    open: 'Whether the context menu popup is open.',
    label: 'Accessible label for the context menu.',
    forceFallback: 'Forces non-top-layer fallback overlay and JS positioning.',
    items: 'Structured menu tree supporting separators, shortcuts, and nested submenus.',
  },
  eventDescriptions: {
    'mth-select': 'Fired when a leaf menu item is activated.',
    'mth-open': 'Cancelable event fired before opening the menu.',
    'mth-after-open': 'Fired after the menu opens.',
    'mth-close': 'Cancelable event fired before closing the menu.',
    'mth-after-close': 'Fired after the menu closes.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Floating menu surface background.' },
    { name: '--mth-color-fg', description: 'Primary foreground text color.' },
    { name: '--mth-color-fg-muted', description: 'Shortcut hint foreground color.' },
    { name: '--mth-color-border', description: 'Menu border and separator color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring outline color.' },
    { name: '--mth-radius-md', description: 'Menu and item corner radius.' },
    { name: '--mth-shadow-lg', description: 'Floating menu elevation shadow.' },
    { name: '--mth-z-index-popover', description: 'Menu stacking z-index.' },
  ],
};
