import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { menubarMessages } from './menubar.messages.js';

export interface MenubarSubItem {
  readonly id?: string;
  readonly value: string;
  readonly label: string;
  readonly href?: string;
  readonly disabled?: boolean;
  readonly shortcut?: string;
}

export interface MenubarItem {
  readonly id?: string;
  readonly value: string;
  readonly label: string;
  readonly href?: string;
  readonly disabled?: boolean;
  readonly children?: ReadonlyArray<MenubarSubItem>;
}

export const EMPTY_MENUBAR_ITEMS: ReadonlyArray<MenubarItem> = Object.freeze([]);

export const menubarSpec: ComponentBehaviorSpec = {
  tag: 'mth-menubar',
  package: '@methane/ui',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController', 'ObserverPoolController'],
  focusModel: 'delegates-focus',
  states: ['open'],
  keyboard: [
    {
      key: 'ArrowRight',
      when: 'horizontal menubar',
      expect: 'moves focus to next menubar item (wraps, reverses in RTL)',
    },
    {
      key: 'ArrowLeft',
      when: 'horizontal menubar',
      expect: 'moves focus to previous menubar item (wraps, reverses in RTL)',
    },
    {
      key: 'ArrowDown',
      when: 'focused on menubar item with submenu',
      expect: 'opens dropdown menu and focuses first enabled submenu item',
    },
    { key: 'Escape', when: 'submenu open', expect: 'closes submenu and returns focus to trigger' },
  ],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'orientation', attr: 'orientation', type: 'string', default: 'horizontal' },
    {
      name: 'items',
      attr: false,
      type: 'ReadonlyArray<MenubarItem>',
      default: EMPTY_MENUBAR_ITEMS,
    },
  ],
  events: [
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ value: string; label: string; parentValue?: string; href?: string }',
    },
  ],
  slots: [{ name: '', description: 'Optional custom menubar items when items array is empty.' }],
  parts: [
    { name: 'menubar', description: 'WAI-ARIA `[role="menubar"]` container.' },
    { name: 'item', description: 'Top-level `[role="menuitem"]` trigger.' },
    { name: 'menu', description: 'Dropdown `[role="menu"]` popup list.' },
    { name: 'submenu-item', description: 'Submenu `[role="menuitem"]` action.' },
    { name: 'shortcut', description: 'Keyboard shortcut hint label.' },
  ],
  messages: { ...menubarMessages },
};

export const CEM_METADATA = {
  description:
    'WAI-ARIA horizontal or vertical application menubar with roving focus, RTL awareness, and dropdown submenus.',
  propDescriptions: {
    label: 'Accessible label for the menubar.',
    orientation: 'Menubar axis orientation (`horizontal` or `vertical`).',
    items: 'Structured menubar triggers and nested dropdown items.',
  },
  eventDescriptions: {
    'mth-select': 'Fired when a leaf menubar or submenu item is activated.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Menubar background color.' },
    { name: '--mth-color-surface-raised', description: 'Dropdown submenu background.' },
    { name: '--mth-color-fg', description: 'Primary foreground text color.' },
    { name: '--mth-color-fg-muted', description: 'Shortcut hint foreground color.' },
    { name: '--mth-color-border', description: 'Menubar and submenu border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring outline color.' },
    { name: '--mth-radius-md', description: 'Control and menu corner radius.' },
    { name: '--mth-shadow-lg', description: 'Dropdown submenu elevation shadow.' },
    { name: '--mth-z-index-popover', description: 'Dropdown stacking layer.' },
  ],
};
