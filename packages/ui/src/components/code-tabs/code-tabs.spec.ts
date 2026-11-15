import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { codeTabsMessages } from './code-tabs.messages.js';

export const codeTabsSpec: ComponentBehaviorSpec = {
  tag: 'mth-code-tabs',
  package: '@methane-ui/ui',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController', 'SlotCollectionController'],
  focusModel: 'delegates-focus',
  states: [],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'A code tab has focus', expect: 'Moves focus and activates the next code tab' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'A code tab has focus in RTL', expect: 'Moves focus and activates the next code tab' },
    { key: 'Home', when: 'Any code tab has focus', expect: 'Moves focus and activates the first code tab' },
    { key: 'End', when: 'Any code tab has focus', expect: 'Moves focus and activates the last code tab' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'tabs', attr: false, type: 'ReadonlyArray<CodeTabItem> | null', default: null },
    { name: 'showCopy', attr: 'show-copy', type: 'boolean', default: true },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ value: string }',
    },
    {
      name: 'mth-copy',
      cancelable: false,
      detailType: '{ value: string; code: string; ok: boolean }',
    },
  ],
  slots: [
    { name: '', description: 'Slotted code tab elements with `label` (or `data-label`) and optional `value` / `language` attributes.' },
  ],
  parts: [
    { name: 'base', description: 'Outer code-tabs container.' },
    { name: 'header', description: 'Header row containing tablist and copy button.' },
    { name: 'tablist', description: 'Internal `role="tablist"` container.' },
    { name: 'tab', description: 'Individual code tab trigger button.' },
    { name: 'copy-button', description: 'Copy active code snippet button.' },
    { name: 'panel', description: 'Active `role="tabpanel"` code container.' },
    { name: 'code', description: 'Preformatted `<code>` block displaying the active snippet.' },
  ],
  messages: { ...codeTabsMessages },
};

export const CEM_METADATA = {
  description: 'Accessible multi-snippet code tab switcher supporting slotted or property-driven tabs, roving keyboard navigation, and copy-to-clipboard.',
  propDescriptions: {
    value: 'Active tab identifier.',
    label: 'Accessible label for the internal tablist.',
    tabs: 'Optional programmatic array of code tab definitions.',
    showCopy: 'Whether to display the copy-to-clipboard button.',
  },
  eventDescriptions: {
    'mth-change': 'Dispatched when the active code tab changes.',
    'mth-copy': 'Dispatched after the copy button copies or attempts to copy the active snippet.',
  },
  cssProperties: [],
};
