import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { markdownMessages } from './markdown.messages.js';

export const markdownSpec: ComponentBehaviorSpec = {
  tag: 'mth-markdown',
  package: '@methane-ui/editor',
  conformance: ['satellite'],
  controllers: [],
  focusModel: 'none',
  states: ['rendered'],
  keyboard: [],
  props: [
    { name: 'content', attr: 'content', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'allowRawHtml', attr: 'allow-raw-html', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-render', cancelable: false, detailType: '{ length: number }' },
  ],
  slots: [
    { name: '', description: 'Optional light-DOM Markdown text used when content prop is empty.' },
    { name: 'fallback', description: 'Progressive-enhancement fallback slot before upgrade.' },
  ],
  parts: [
    { name: 'base', description: 'Rendered Markdown region container.' },
    { name: 'content', description: 'Sanitized rendered HTML output.' },
    { name: 'source', description: 'Hidden default slot collector.' },
    { name: 'fallback', description: 'Fallback slot wrapper.' },
  ],
  messages: { ...markdownMessages },
};

export const CEM_METADATA = {
  description:
    'Read-only Markdown renderer using @methane-ui/sanitize with safe URL validation and token synchronization.',
  cssProperties: [
    { name: '--mth-color-surface', description: 'Rendered region surface background.' },
    { name: '--mth-color-bg-subtle', description: 'Code and blockquote background color.' },
    { name: '--mth-color-fg', description: 'Primary text foreground color.' },
    { name: '--mth-color-fg-muted', description: 'Muted blockquote text color.' },
    { name: '--mth-color-border', description: 'Blockquote and container border color.' },
    { name: '--mth-color-accent', description: 'Rendered link foreground color.' },
    { name: '--mth-font-sans', description: 'Rendered prose font family.' },
    { name: '--mth-font-mono', description: 'Inline and block code font family.' },
  ],
};
