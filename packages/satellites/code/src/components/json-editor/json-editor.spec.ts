import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { jsonEditorMessages } from './json-editor.messages.js';

export type JsonEditorMode = 'code' | 'tree' | 'split';

export const jsonEditorSpec: ComponentBehaviorSpec = {
  tag: 'mth-json-editor',
  package: '@methane-ui/code',
  conformance: ['satellite', 'form-control'],
  controllers: ['FormControlController', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'invalid', 'dirty', 'touched', 'focused', 'split'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'toolbar button focused', expect: 'moves focus to next control' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'toolbar button focused', expect: 'moves focus to next control' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'mode', attr: 'mode', type: "'code' | 'tree' | 'split'", default: 'code' },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string; valid: boolean }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; valid: boolean }' },
    { name: 'mth-mode-change', cancelable: false, detailType: '{ mode: JsonEditorMode }' },
  ],
  slots: [
    { name: 'toolbar', description: 'Optional extra toolbar actions.' },
    { name: 'fallback', description: 'Progressive-enhancement fallback slot before upgrade.' },
  ],
  parts: [
    { name: 'label', description: 'Visible field label.' },
    { name: 'base', description: 'Outer JSON editor frame.' },
    { name: 'header', description: 'Mode switcher and format toolbar.' },
    { name: 'tool-button', description: 'Mode or format action button.' },
    { name: 'panes', description: 'Container for CodeMirror editor and JSON tree pane.' },
    { name: 'surface', description: 'CodeMirror 6 editor host surface.' },
    { name: 'tree', description: 'Collapsible JSON tree inspection pane.' },
    { name: 'error', description: 'Live JSON syntax validation error banner.' },
    { name: 'fallback', description: 'Fallback slot wrapper.' },
  ],
  messages: { ...jsonEditorMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated CodeMirror 6 JSON editor with live JSON syntax validation, prettify formatting, collapsible interactive tree view, and `--mth-*` token synchronization.',
  cssProperties: [
    { name: '--mth-color-surface', description: 'JSON editor background surface.' },
    { name: '--mth-color-bg-subtle', description: 'Toolbar background color.' },
    { name: '--mth-color-fg', description: 'Primary foreground color.' },
    { name: '--mth-color-fg-muted', description: 'Muted label foreground color.' },
    { name: '--mth-color-border', description: 'Frame and pane divider border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring outline color.' },
    { name: '--mth-color-accent', description: 'Active mode and JSON key highlight color.' },
    { name: '--mth-radius-md', description: 'Frame corner radius.' },
    { name: '--mth-font-mono', description: 'JSON editor and tree font family.' },
    { name: '--mth-font-sans', description: 'Toolbar and error text font family.' },
  ],
};
