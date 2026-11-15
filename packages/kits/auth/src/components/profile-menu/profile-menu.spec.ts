import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { profileMenuMessages } from './profile-menu.messages.js';

export const profileMenuSpec: ComponentBehaviorSpec = {
  tag: 'mth-profile-menu',
  package: '@methane/auth',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'PositioningController', 'RovingFocusController'],
  focusModel: 'host',
  states: ['open', 'disabled'],
  keyboard: [
    { key: 'Escape', when: 'Menu overlay is open', expect: 'Closes menu and restores focus to trigger' },
    { key: 'ArrowDown', when: 'Menu item is focused', expect: 'Moves focus to next menu item' },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'email', attr: 'email', type: 'string', default: '' },
    { name: 'avatarSrc', attr: 'avatar-src', type: 'string', default: '' },
    { name: 'userRole', attr: 'user-role', type: 'string', default: '' },
    { name: 'items', attr: false, type: 'ReadonlyArray<ProfileMenuItem>' },
    { name: 'placement', attr: 'placement', type: 'Placement', default: 'bottom-end' },
    { name: 'offset', attr: 'offset', type: 'number', default: 8 },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'void' },
    { name: 'mth-after-open', cancelable: false, detailType: 'void' },
    { name: 'mth-close', cancelable: false, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: '{ reason: string }' },
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ id: string; label: string; item: ProfileMenuItem }',
    },
  ],
  slots: [{ name: 'default', description: 'Optional extra menu footer or links.' }],
  parts: [
    { name: 'trigger', description: 'Avatar trigger button.' },
    { name: 'menu', description: 'Floating profile menu container.' },
    { name: 'item', description: 'Individual menu action button.' },
  ],
  messages: { ...profileMenuMessages },
};

export const CEM_METADATA = {
  description:
    'Authenticated user profile menu trigger with positioned overlay popover, role badge, and roving menu items.',
  propDescriptions: {
    open: 'Whether the profile dropdown menu is open.',
    name: 'Authenticated user display name.',
    email: 'Authenticated user email address.',
    avatarSrc: 'Avatar image URL rendered inside `<mth-avatar>`.',
    userRole: 'Optional user role badge shown in menu header.',
    items: 'Menu action entries rendered inside the overlay.',
    placement: 'Preferred overlay placement relative to the trigger.',
    offset: 'Gap in pixels between trigger and menu surface.',
    disabled: 'Disables opening the profile menu.',
  },
  eventDescriptions: {
    'mth-open': 'Emitted before opening; cancelable.',
    'mth-after-open': 'Emitted after menu opens.',
    'mth-close': 'Emitted before closing.',
    'mth-after-close': 'Emitted after menu closes.',
    'mth-select': 'Emitted when a menu action is selected.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Floating menu card background.' },
    { name: '--mth-z-index-popover', description: 'Floating menu stack layer.' },
  ],
};
