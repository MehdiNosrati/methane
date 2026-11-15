import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { settingsShellMessages } from './settings-shell.messages.js';

export const settingsShellSpec: ComponentBehaviorSpec = {
  tag: 'mth-settings-shell',
  package: '@methane-ui/admin',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['dirty', 'saving'],
  keyboard: [
    { key: 'ArrowDown', when: 'section rail has focus', expect: 'moves focus to next settings section' },
    { key: 'ArrowUp', when: 'section rail has focus', expect: 'moves focus to previous settings section' },
  ],
  props: [
    { name: 'sections', attr: false, type: 'ReadonlyArray<SettingsSectionItem>', default: undefined },
    { name: 'activeSectionId', attr: 'active-section-id', type: 'string', default: '' },
    { name: 'dirty', attr: 'dirty', type: 'boolean', default: false },
    { name: 'saving', attr: 'saving', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-section-change', cancelable: false, detailType: '{ id: string }' },
    { name: 'mth-save', cancelable: false, detailType: '{ activeSectionId: string }' },
    { name: 'mth-discard', cancelable: false, detailType: '{ activeSectionId: string }' },
  ],
  slots: [
    { name: '', description: 'Active settings form or pane content.' },
    { name: 'header', description: 'Optional top header slot.' },
  ],
  parts: [
    { name: 'base', description: 'Outer settings layout grid.' },
    { name: 'nav', description: 'Section navigation rail.' },
    { name: 'nav-item', description: 'Section navigation button.' },
    { name: 'content', description: 'Active settings pane container.' },
    { name: 'save-bar', description: 'Dirty-state save/discard action bar.' },
  ],
  messages: settingsShellMessages,
};

export const CEM_METADATA = {
  description: 'Admin settings shell (`<mth-settings-shell>`) combining a roving-focus section rail, active content pane, and dirty-state save/discard bar.',
  propDescriptions: {
    sections: 'Section definitions displayed in the navigation rail.',
    activeSectionId: 'Currently active section ID.',
    dirty: 'Reveals the unsaved-changes save/discard action bar.',
    saving: 'Indicates an in-flight save operation.',
  },
  eventDescriptions: {
    'mth-section-change': 'Emitted when the user selects another settings section.',
    'mth-save': 'Emitted when Save changes is activated.',
    'mth-discard': 'Emitted when Discard is activated.',
  },
};
