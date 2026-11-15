import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { mathEditorMessages } from './math-editor.messages.js';

export const mathEditorSpec: ComponentBehaviorSpec = {
  tag: 'mth-math-editor',
  package: '@methane-ui/editor',
  conformance: ['satellite', 'form-control'],
  controllers: ['FormControlController', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'invalid', 'display-mode', 'dirty', 'touched', 'focused'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'symbol button focused', expect: 'moves focus to next symbol button' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'symbol button focused', expect: 'moves focus to next symbol button' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'displayMode', attr: 'display-mode', type: 'boolean', default: true },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-error', cancelable: false, detailType: '{ message: string }' },
  ],
  slots: [
    { name: 'toolbar', description: 'Optional extra quick-symbol buttons.' },
    { name: 'fallback', description: 'Progressive-enhancement fallback slot before upgrade.' },
  ],
  parts: [
    { name: 'label', description: 'Visible field label element.' },
    { name: 'base', description: 'Outer math editor frame.' },
    { name: 'toolbar', description: 'Quick-symbol toolbar button group.' },
    { name: 'tool-button', description: 'Quick-symbol insertion button.' },
    { name: 'textarea', description: 'LaTeX source input textarea.' },
    { name: 'preview', description: 'Sanitized KaTeX formula preview surface.' },
    { name: 'error', description: 'Parse or validation error banner.' },
    { name: 'fallback', description: 'Fallback slot wrapper.' },
  ],
  messages: { ...mathEditorMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated LaTeX formula editor with quick-symbol toolbar, KaTeX rendering, sanitized preview, and token synchronization.',
  cssProperties: [
    { name: '--mth-color-surface', description: 'Editor background surface.' },
    { name: '--mth-color-bg-subtle', description: 'Toolbar and preview header background color.' },
    { name: '--mth-color-fg', description: 'Primary formula text color.' },
    { name: '--mth-color-fg-muted', description: 'Muted secondary text color.' },
    { name: '--mth-color-border', description: 'Frame and divider border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring outline color.' },
    { name: '--mth-color-accent', description: 'Interactive symbol highlight color.' },
    { name: '--mth-radius-md', description: 'Frame corner radius.' },
    { name: '--mth-font-sans', description: 'Toolbar and error text font family.' },
    { name: '--mth-font-mono', description: 'LaTeX source textarea font family.' },
  ],
};
