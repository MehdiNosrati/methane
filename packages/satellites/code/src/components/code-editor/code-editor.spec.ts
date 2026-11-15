import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { codeEditorMessages } from './code-editor.messages.js';

export const codeEditorSpec: ComponentBehaviorSpec = {
  tag: 'mth-code-editor',
  package: '@methane/code',
  conformance: ['satellite', 'form-control'],
  controllers: ['FormControlController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'invalid', 'dirty', 'touched', 'focused', 'tab-trap'],
  keyboard: [
    { key: 'Escape', dir: 'ltr', when: 'editor surface focused in indent mode', expect: 'restores Tab focus navigation' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'language', attr: 'language', type: 'string', default: 'typescript' },
    { name: 'tabTrapsFocus', attr: 'tab-traps-focus', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
  ],
  slots: [
    { name: 'toolbar', description: 'Optional extra editor actions.' },
    { name: 'fallback', description: 'Progressive-enhancement fallback slot before upgrade.' },
  ],
  parts: [
    { name: 'label', description: 'Visible editor field label.' },
    { name: 'base', description: 'Outer editor frame.' },
    { name: 'header', description: 'Language indicator and keyboard escape toggle bar.' },
    { name: 'tab-toggle', description: 'Toggle button switching Tab between indentation and focus navigation.' },
    { name: 'surface', description: 'CodeMirror 6 editor host surface.' },
    { name: 'fallback', description: 'Fallback slot wrapper.' },
  ],
  messages: { ...codeEditorMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated CodeMirror 6 code editor with non-trapping Tab escape toggle, `--mth-*` theme compartment sync, and hydration-pure lifecycle.',
  cssProperties: [
    { name: '--mth-color-surface', description: 'CodeMirror editor background surface.' },
    { name: '--mth-color-bg-subtle', description: 'Header bar background color.' },
    { name: '--mth-color-fg', description: 'Primary code foreground color.' },
    { name: '--mth-color-fg-muted', description: 'Language badge and muted label color.' },
    { name: '--mth-color-border', description: 'Frame border color.' },
    { name: '--mth-color-border-focus', description: 'Focused editor outline color.' },
    { name: '--mth-color-accent', description: 'Caret and active toggle highlight color.' },
    { name: '--mth-radius-md', description: 'Frame corner radius.' },
    { name: '--mth-font-mono', description: 'CodeMirror editor font family.' },
    { name: '--mth-font-sans', description: 'Header and toggle control font family.' },
  ],
};
