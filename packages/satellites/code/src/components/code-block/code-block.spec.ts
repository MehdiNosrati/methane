import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { codeBlockMessages } from './code-block.messages.js';

export const codeBlockSpec: ComponentBehaviorSpec = {
  tag: 'mth-code-block',
  package: '@methane/code',
  conformance: ['satellite'],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['copied', 'line-numbers', 'custom-highlight'],
  keyboard: [],
  props: [
    { name: 'code', attr: 'code', type: 'string', default: '' },
    { name: 'language', attr: 'language', type: 'string', default: 'text' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'lineNumbers', attr: 'line-numbers', type: 'boolean', default: false },
    { name: 'highlightLines', attr: 'highlight-lines', type: 'string', default: '' },
    { name: 'showCopy', attr: 'show-copy', type: 'boolean', default: true },
  ],
  events: [
    { name: 'mth-copy', cancelable: false, detailType: '{ code: string }' },
  ],
  slots: [
    { name: '', description: 'Optional slotted source code when code prop is omitted.' },
    { name: 'fallback', description: 'Progressive-enhancement fallback slot before upgrade.' },
  ],
  parts: [
    { name: 'base', description: 'Outer code block container.' },
    { name: 'header', description: 'Language badge and copy action bar.' },
    { name: 'language', description: 'Language identifier label.' },
    { name: 'copy-button', description: 'Button to copy source code.' },
    { name: 'pre', description: 'Scrollable preformatted code container.' },
    { name: 'code', description: 'Tokenized code content element.' },
    { name: 'line', description: 'Individual rendered code line.' },
    { name: 'line-number', description: 'Line gutter number.' },
    { name: 'token', description: 'Fallback syntax token span.' },
    { name: 'status', description: 'Accessible live status region for copy feedback.' },
    { name: 'fallback', description: 'Fallback slot wrapper.' },
  ],
  messages: { ...codeBlockMessages },
};

export const CEM_METADATA = {
  description:
    'Read-only syntax-highlighted code block using the CSS Custom Highlight API (`CSS.highlights`) with accessible token span fallback, line highlighting, and clipboard copy.',
  cssProperties: [
    { name: '--mth-color-surface', description: 'Code block container background surface.' },
    { name: '--mth-color-bg-subtle', description: 'Header bar background color.' },
    { name: '--mth-color-fg', description: 'Primary code foreground color.' },
    { name: '--mth-color-fg-muted', description: 'Line numbers and muted label color.' },
    { name: '--mth-color-border', description: 'Container border color.' },
    { name: '--mth-color-accent', description: 'Keyword token and highlighted line accent.' },
    { name: '--mth-radius-md', description: 'Container corner radius.' },
    { name: '--mth-font-mono', description: 'Source code font family.' },
    { name: '--mth-font-sans', description: 'Header and action control font family.' },
  ],
};
