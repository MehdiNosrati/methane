import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { diffViewerMessages } from './diff-viewer.messages.js';

export type DiffViewMode = 'unified' | 'split';

export const diffViewerSpec: ComponentBehaviorSpec = {
  tag: 'mth-diff-viewer',
  package: '@methane/code',
  conformance: ['satellite'],
  controllers: ['RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['split'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'toolbar button focused', expect: 'moves focus to next control' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'toolbar button focused', expect: 'moves focus to next control' },
  ],
  props: [
    { name: 'original', attr: 'original', type: 'string', default: '' },
    { name: 'modified', attr: 'modified', type: 'string', default: '' },
    { name: 'filename', attr: 'filename', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'view', attr: 'view', type: "'unified' | 'split'", default: 'unified' },
  ],
  events: [
    { name: 'mth-view-change', cancelable: false, detailType: '{ view: DiffViewMode }' },
    { name: 'mth-hunk-change', cancelable: false, detailType: '{ hunkIndex: number; total: number }' },
  ],
  slots: [
    { name: 'fallback', description: 'Progressive-enhancement fallback slot before upgrade.' },
  ],
  parts: [
    { name: 'base', description: 'Outer diff viewer container.' },
    { name: 'header', description: 'Filename, diff counts, view toggle, and hunk navigation bar.' },
    { name: 'tool-button', description: 'Diff view or hunk navigation button.' },
    { name: 'surface', description: 'Diff rows container.' },
    { name: 'row', description: 'Individual diff line row.' },
    { name: 'fallback', description: 'Fallback slot wrapper.' },
  ],
  messages: { ...diffViewerMessages },
};

export const CEM_METADATA = {
  description:
    'Unified and side-by-side line diff viewer with LCS diffing, keyboard hunk navigation, accessible semantics, and `--mth-*` token synchronization.',
  cssProperties: [
    { name: '--mth-color-surface', description: 'Diff viewer background surface.' },
    { name: '--mth-color-bg-subtle', description: 'Toolbar background color.' },
    { name: '--mth-color-fg', description: 'Primary diff line foreground color.' },
    { name: '--mth-color-fg-muted', description: 'Line numbers and stats color.' },
    { name: '--mth-color-border', description: 'Container border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring outline color.' },
    { name: '--mth-color-accent', description: 'Active hunk outline and mode accent color.' },
    { name: '--mth-radius-md', description: 'Container corner radius.' },
    { name: '--mth-font-mono', description: 'Diff content font family.' },
    { name: '--mth-font-sans', description: 'Toolbar font family.' },
  ],
};
