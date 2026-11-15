import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { aiMessageMessages } from './ai-message.messages.js';

export const aiMessageSpec: ComponentBehaviorSpec = {
  tag: 'mth-ai-message',
  package: '@methane-ui/ai',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['streaming', 'copied'],
  keyboard: [],
  props: [
    {
      name: 'role',
      attr: 'role',
      type: "'user' | 'assistant' | 'system'",
      default: 'assistant',
    },
    { name: 'content', attr: 'content', type: 'string', default: '' },
    { name: 'allowRawHtml', attr: 'allow-raw-html', type: 'boolean', default: false },
    { name: 'streaming', attr: 'streaming', type: 'boolean', default: false },
    { name: 'author', attr: 'author', type: 'string', default: '' },
    { name: 'timestamp', attr: 'timestamp', type: 'string', default: '' },
    { name: 'showActions', attr: 'show-actions', type: 'boolean', default: true },
  ],
  events: [
    { name: 'mth-copy', cancelable: false, detailType: '{ content: string; ok: boolean }' },
    { name: 'mth-regenerate', cancelable: false, detailType: '{ content: string }' },
  ],
  slots: [
    { name: '', description: 'Optional trailing light-DOM body content.' },
    { name: 'avatar', description: 'Optional custom avatar overriding default `<mth-avatar>`.' },
    { name: 'header', description: 'Optional custom header content.' },
    { name: 'actions', description: 'Additional action buttons rendered alongside copy/regenerate.' },
    { name: 'footer', description: 'Optional footer metadata or citations below the message.' },
  ],
  parts: [
    { name: 'base', description: 'Root article container representing the message.' },
    { name: 'avatar', description: 'Avatar column container.' },
    { name: 'header', description: 'Author, role badge, and timestamp bar.' },
    { name: 'content', description: 'Sanitized markdown message body container.' },
    { name: 'cursor', description: 'Streaming caret indicator shown when `streaming` is true.' },
    { name: 'actions', description: 'Action toolbar containing copy and regenerate controls.' },
    { name: 'footer', description: 'Optional footer slot wrapper.' },
  ],
  messages: { ...aiMessageMessages },
};

export const CEM_METADATA = {
  description:
    'AI conversation message bubble with sanitized streaming Markdown rendering (ADR-012) and copy/regenerate actions.',
  propDescriptions: {
    role: 'Sender role (`user`, `assistant`, or `system`).',
    content: 'Markdown text content rendered through `@methane-ui/sanitize`.',
    allowRawHtml: 'Opt-in raw HTML sanitization inside Markdown. Disabled (`false`) by default.',
    streaming: 'Displays active streaming cursor indicator and live region updates.',
    author: 'Display author name overriding localized role label.',
    timestamp: 'Optional formatted timestamp displayed in the header.',
    showActions: 'Shows copy and regenerate action buttons.',
  },
  eventDescriptions: {
    'mth-copy': 'Fired when the message content is copied via `ClipboardAndShare`.',
    'mth-regenerate': 'Fired when the user requests regenerating an assistant response.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Assistant message background color.' },
    { name: '--mth-color-accent-subtle', description: 'User message background color.' },
    { name: '--mth-color-border', description: 'Message border color.' },
    { name: '--mth-radius-lg', description: 'Message card corner radius.' },
  ],
};
