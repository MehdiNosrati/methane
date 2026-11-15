import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { richEditorMessages } from './rich-editor.messages.js';

export const richEditorSpec: ComponentBehaviorSpec = {
  tag: 'mth-rich-editor',
  package: '@methane/editor',
  conformance: ['satellite', 'form-control'],
  controllers: ['FormControlController', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'invalid', 'dirty', 'touched', 'focused'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'toolbar button focused', expect: 'moves focus to next toolbar action' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'toolbar button focused', expect: 'moves focus to next toolbar action' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string; html: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; html: string }' },
  ],
  slots: [
    { name: 'toolbar', description: 'Optional trailing toolbar actions.' },
    { name: 'fallback', description: 'Static SSR or screen-reader fallback content.' },
  ],
  parts: [
    { name: 'base', description: 'Outer editor frame.' },
    { name: 'label', description: 'Visible editor label.' },
    { name: 'toolbar', description: 'Formatting actions `role="toolbar"`.' },
    { name: 'tool-button', description: 'Individual formatting button.' },
    { name: 'surface', description: 'Mounted ProseMirror editor surface.' },
    { name: 'fallback', description: 'Fallback slot container.' },
  ],
  messages: { ...richEditorMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated ProseMirror rich-text editor with accessible formatting toolbar (`RovingFocusController`), `@methane/sanitize` HTML serialization, and `--mth-*` token sync.',
  propDescriptions: {
    name: 'Form submission field name.',
    label: 'Visible and accessible label for the editor.',
    value: 'Sanitized HTML document content.',
    placeholder: 'Hint text when document is empty.',
    required: 'Marks content required during form validation.',
    disabled: 'Prevents editing and form submission.',
    readonly: 'Displays content without allowing mutations.',
  },
  eventDescriptions: {
    'mth-input': 'Fired synchronously on every ProseMirror document transaction.',
    'mth-change': 'Fired when edited content blurs or is committed.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Editor background surface.' },
    { name: '--mth-color-bg-subtle', description: 'Toolbar background color.' },
    { name: '--mth-color-fg', description: 'Primary text foreground color.' },
    { name: '--mth-color-fg-muted', description: 'Muted placeholder and icon color.' },
    { name: '--mth-color-border', description: 'Frame and toolbar border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring outline color.' },
    { name: '--mth-color-accent', description: 'Active toolbar state highlight.' },
    { name: '--mth-radius-md', description: 'Frame corner radius.' },
    { name: '--mth-font-sans', description: 'Editor body font family.' },
    { name: '--mth-font-size-md', description: 'Editor body font size.' },
  ],
};
