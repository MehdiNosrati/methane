import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { menuItemMessages } from './menu-item.messages.js';

export const menuItemSpec: ComponentBehaviorSpec = {
  tag: 'mth-menu-item',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  role: 'menuitem',
  states: ['checked', 'disabled', 'active', 'submenu-open'],
  keyboard: [
    { key: 'Enter', when: 'enabled', expect: 'activates item or toggles checked state' },
    { key: ' ', when: 'enabled', expect: 'activates item or toggles checked state' },
    { key: 'ArrowRight', when: 'LTR and item has submenu', expect: 'opens nested submenu' },
    { key: 'ArrowLeft', when: 'LTR and submenu is open', expect: 'closes nested submenu' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    {
      name: 'type',
      attr: 'type',
      type: "'normal' | 'checkbox' | 'radio'",
      default: 'normal',
    },
    { name: 'checked', attr: 'checked', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'shortcut', attr: 'shortcut', type: 'string', default: '' },
    { name: 'group', attr: 'group', type: 'string', default: '' },
    { name: 'active', attr: 'active', type: 'boolean', default: false },
    { name: 'submenuOpen', attr: 'submenu-open', type: 'boolean', default: false },
    {
      name: 'itemRole',
      attr: 'item-role',
      type: "'auto' | 'menuitem' | 'menuitemcheckbox' | 'menuitemradio' | 'option'",
      default: 'auto',
    },
  ],
  events: [
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ value: string; checked: boolean }',
    },
  ],
  slots: [
    { name: '', description: 'Primary menu item label.' },
    { name: 'prefix', description: 'Optional leading icon.' },
    { name: 'suffix', description: 'Optional trailing content.' },
    { name: 'submenu', description: 'Optional nested submenu `<mth-menu-item>` children.' },
  ],
  parts: [
    { name: 'base', description: 'Interactive row container.' },
    { name: 'check', description: 'Checkmark or radio dot indicator.' },
    { name: 'label', description: 'Primary label text wrapper.' },
    { name: 'shortcut', description: 'Keyboard shortcut hint badge.' },
    { name: 'submenu-arrow', description: 'Submenu disclosure indicator.' },
    { name: 'submenu', description: 'Nested submenu popup list container.' },
  ],
  messages: { ...menuItemMessages },
};

export const CEM_METADATA = {
  description:
    'Interactive menu item for `<mth-dropdown-menu>` supporting normal, checkbox, radio, keyboard shortcuts, and nested submenus.',
  propDescriptions: {
    value: 'Machine value emitted in `mth-select` event detail.',
    type: 'Item semantics (`normal | checkbox | radio`).',
    checked: 'Checked/selected state for `checkbox` and `radio` items.',
    disabled: 'Disables activation and skips keyboard focus.',
    shortcut: 'Displayed keyboard shortcut label.',
    group: 'Logical radio group identifier shared across sibling radio items.',
    active: 'Marks whether the item is currently highlighted.',
    submenuOpen: 'Controls visibility of the nested `slot="submenu"` panel.',
    itemRole: 'Overrides computed ARIA role (e.g., `option` when hosted in a listbox menu).',
  },
  eventDescriptions: {
    'mth-select': 'Fired when the item is activated via click or keyboard.',
  },
  cssProperties: [
    { name: '--mth-color-bg-subtle', description: 'Hover/active item background.' },
    { name: '--mth-color-accent', description: 'Check/radio indicator color.' },
    { name: '--mth-color-fg-muted', description: 'Keyboard shortcut text color.' },
    { name: '--mth-radius-sm', description: 'Menu item corner radius.' },
  ],
};
