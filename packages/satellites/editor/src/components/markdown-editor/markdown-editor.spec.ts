import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { markdownEditorMessages } from './markdown-editor.messages.js';

export type MarkdownEditorMode = 'write' | 'preview' | 'split';

export const markdownEditorSpec: ComponentBehaviorSpec = {
  tag: 'mth-markdown-editor',
  package: '@methane/editor',
  conformance: ['satellite', 'form-control'],
  controllers: ['FormControlController', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'invalid', 'split', 'dirty', 'touched', 'focused'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'toolbar button focused', expect: 'moves focus to next toolbar action' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'toolbar button focused', expect: 'moves focus to next toolbar action' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'mode', attr: 'mode', type: "'write' | 'preview' | 'split'", default: 'write' },
    { name: 'allowRawHtml', attr: 'allow-raw-html', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-mode-change', cancelable: false, detailType: '{ mode: MarkdownEditorMode }' },
  ],
  slots: [
    { name: 'toolbar', description: 'Optional extra toolbar actions.' },
    { name: 'fallback', description: 'Progressive-enhancement fallback slot before upgrade.' },
  ],
  parts: [
    { name: 'label', description: 'Visible field label element.' },
    { name: 'base', description: 'Outer editor frame.' },
    { name: 'header', description: 'Toolbar and view-mode bar.' },
    { name: 'toolbar', description: 'Formatting toolbar button group.' },
    { name: 'tool-button', description: 'Formatting or mode button.' },
    { name: 'panes', description: 'Container holding source textarea and/or preview pane.' },
    { name: 'textarea', description: 'Markdown source textarea.' },
    { name: 'preview', description: 'Sanitized live Markdown preview surface.' },
    { name: 'fallback', description: 'Fallback slot wrapper.' },
  ],
  messages: { ...markdownEditorMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated Markdown editor with roving formatting toolbar, write/preview/split modes, and sanitized preview rendering.',
  cssProperties: [
    { name: '--mth-color-surface', description: 'Editor background surface.' },
    { name: '--mth-color-bg-subtle', description: 'Toolbar and code background color.' },
    { name: '--mth-color-fg', description: 'Primary text foreground color.' },
    { name: '--mth-color-fg-muted', description: 'Muted control foreground color.' },
    { name: '--mth-color-border', description: 'Frame and pane divider border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring outline color.' },
    { name: '--mth-color-accent', description: 'Active mode highlight and link color.' },
    { name: '--mth-radius-md', description: 'Frame corner radius.' },
    { name: '--mth-font-sans', description: 'Toolbar and preview font family.' },
    { name: '--mth-font-mono', description: 'Markdown source textarea font family.' },
  ],
};
