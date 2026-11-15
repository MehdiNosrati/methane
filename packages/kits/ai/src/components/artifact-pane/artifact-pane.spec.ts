import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { artifactPaneMessages } from './artifact-pane.messages.js';

export const artifactPaneSpec: ComponentBehaviorSpec = {
  tag: 'mth-artifact-pane',
  package: '@methane-ui/ai',
  conformance: [],
  controllers: ['RovingFocusController', 'MotionController'],
  focusModel: 'none',
  states: ['open', 'copied'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'tab focused', expect: 'moves focus between Code and Preview tabs (RTL flipped)' },
    { key: 'ArrowLeft', dir: 'ltr', when: 'tab focused', expect: 'moves focus between Code and Preview tabs (RTL flipped)' },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: true },
    { name: 'title', attr: 'title', type: 'string', default: '' },
    { name: 'kind', attr: 'kind', type: "'code' | 'html' | 'markdown'", default: 'code' },
    { name: 'language', attr: 'language', type: 'string', default: 'text' },
    { name: 'content', attr: 'content', type: 'string', default: '' },
    { name: 'versions', attr: false, type: 'ArtifactVersion[]' },
    { name: 'activeVersion', attr: 'active-version', type: 'string', default: '' },
    { name: 'activeTab', attr: 'active-tab', type: "'code' | 'preview'", default: 'code' },
    { name: 'allowRawHtml', attr: 'allow-raw-html', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-copy', cancelable: false, detailType: '{ content: string; ok: boolean }' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-version-change', cancelable: false, detailType: '{ version: string }' },
    { name: 'mth-tab-change', cancelable: false, detailType: "{ tab: 'code' | 'preview' }" },
  ],
  slots: [{ name: 'actions', description: 'Optional extra header toolbar actions.' }],
  parts: [
    { name: 'base', description: 'Outer artifact panel container.' },
    { name: 'header', description: 'Title, version selector, tab switcher, copy, and close bar.' },
    { name: 'code', description: 'Escaped source code `<pre>` block.' },
    { name: 'preview-body', description: 'Sanitized HTML/Markdown preview container.' },
    { name: 'copy-button', description: 'Copy artifact source button.' },
    { name: 'close-button', description: 'Close artifact button.' },
  ],
  messages: { ...artifactPaneMessages },
};

export const CEM_METADATA = {
  description:
    'Tabbed AI artifact viewer with version selection, ClipboardAndShare copy, close action, and `@methane-ui/sanitize` HTML/Markdown preview.',
  propDescriptions: {
    open: 'Controls whether the artifact pane is visible.',
    title: 'Artifact display title.',
    kind: 'Artifact content format (`code` | `html` | `markdown`).',
    language: 'Language badge shown in the header.',
    content: 'Artifact source text or markup.',
    versions: 'Optional array of `{ id, label, content, kind?, language?, title? }` versions.',
    activeVersion: 'Currently selected version ID.',
    activeTab: 'Active view mode (`code` | `preview`).',
    allowRawHtml: 'Controls raw HTML allowance for Markdown previews (false by default).',
  },
  eventDescriptions: {
    'mth-copy': 'Fired when artifact source is copied.',
    'mth-close': 'Cancelable event fired when closing the artifact pane.',
    'mth-version-change': 'Fired when the user switches artifact versions.',
    'mth-tab-change': 'Fired when toggling between code and preview views.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Artifact pane background color.' },
    { name: '--mth-color-border', description: 'Artifact pane border color.' },
    { name: '--mth-radius-lg', description: 'Artifact pane corner radius.' },
  ],
};
