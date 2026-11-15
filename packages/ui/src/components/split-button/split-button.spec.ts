import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const splitButtonSpec: ComponentBehaviorSpec = {
  tag: 'mth-split-button',
  package: '@methane-ui/ui',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'PositioningController', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['open', 'disabled'],
  keyboard: [
    { key: 'ArrowDown', when: 'Secondary trigger is focused', expect: 'Opens menu and focuses first enabled item' },
    { key: 'Escape', when: 'Secondary menu is open', expect: 'Closes menu and restores focus to trigger' },
  ],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'variant', attr: 'variant', type: "'solid' | 'outline' | 'ghost'", default: 'solid' },
    { name: 'size', attr: 'size', type: "'sm' | 'md' | 'lg'", default: 'md' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'menuLabel', attr: 'menu-label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-press', cancelable: true, detailType: '{ originalEvent: Event }' },
    { name: 'mth-select', cancelable: false, detailType: '{ value: string; label: string }' },
    { name: 'mth-open', cancelable: true, detailType: '{ open: true }' },
    { name: 'mth-after-open', cancelable: false, detailType: '{ open: true }' },
    { name: 'mth-close', cancelable: false, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: '{ reason: string }' },
  ],
  slots: [
    { name: '', description: 'Primary action button label content.' },
    { name: 'menu', description: 'Optional declarative menu items when `.items` array is not used.' },
  ],
  parts: [
    { name: 'base', description: 'Root container.' },
    { name: 'group', description: 'Attached primary + trigger button pair.' },
    { name: 'primary', description: 'Primary action button.' },
    { name: 'trigger', description: 'Secondary dropdown toggle button.' },
    { name: 'menu', description: 'Floating menu popup container.' },
    { name: 'item', description: 'Rendered menu item button.' },
  ],
  messages: {
    moreOptions: 'More options',
  },
};

export const CEM_METADATA = {
  description: 'Split action button pairing a primary button with an anchored secondary options menu.',
  propDescriptions: {
    label: 'Optional primary button label when no slotted children are supplied.',
    variant: 'Visual button style (`solid`, `outline`, or `ghost`).',
    size: 'Control size scale (`sm`, `md`, or `lg`).',
    disabled: 'Disables both primary and menu trigger buttons.',
    open: 'Controls visibility of the secondary dropdown menu.',
    menuLabel: 'Accessible `aria-label` for the dropdown toggle button.',
  },
  eventDescriptions: {
    'mth-press': 'Fired when the primary action button is pressed.',
    'mth-select': 'Fired when a secondary menu option is chosen.',
    'mth-open': 'Cancelable event fired before opening the menu.',
    'mth-after-open': 'Fired after open transition completes.',
    'mth-close': 'Fired when the menu closes.',
    'mth-after-close': 'Fired after close transition and focus restore complete.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Solid variant background color.' },
    { name: '--mth-color-surface-raised', description: 'Menu surface background.' },
    { name: '--mth-shadow-md', description: 'Floating menu shadow.' },
  ],
};
