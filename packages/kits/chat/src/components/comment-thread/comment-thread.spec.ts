import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { commentThreadMessages } from './comment-thread.messages.js';

export const commentThreadSpec: ComponentBehaviorSpec = {
  tag: 'mth-comment-thread',
  package: '@methane-ui/chat',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['empty'],
  keyboard: [],
  props: [
    { name: 'comments', attr: false, type: 'ReadonlyArray<CommentItem>' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'allowReply', attr: 'allow-reply', type: 'boolean', default: true },
    { name: 'allowResolve', attr: 'allow-resolve', type: 'boolean', default: true },
    { name: 'allowRawHtml', attr: 'allow-raw-html', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-reply', cancelable: false, detailType: '{ parentId: string; body: string }' },
    {
      name: 'mth-resolve-toggle',
      cancelable: false,
      detailType: '{ id: string; resolved: boolean }',
    },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Root comment thread list.' },
    { name: 'comment', description: 'Individual comment card.' },
    { name: 'author', description: 'Comment author name.' },
    { name: 'body', description: 'Sanitized comment content.' },
    { name: 'reply-toggle', description: 'Button toggling nested reply visibility.' },
    { name: 'reply-button', description: 'Button opening inline reply box.' },
    { name: 'resolve-button', description: 'Button toggling resolved status.' },
    { name: 'replies', description: 'Nested replies container.' },
  ],
  messages: { ...commentThreadMessages },
};

export const CEM_METADATA = {
  description:
    'Nested discussion comment thread with collapse/expand replies, resolve/reopen actions, inline replies, and @methane-ui/sanitize markdown bodies.',
  propDescriptions: {
    comments: 'Top-level comments with optional recursive `replies` arrays.',
    label: 'Accessible region label.',
    allowReply: 'Enables inline reply triggers and forms.',
    allowResolve: 'Enables resolve/reopen controls on top-level threads.',
    allowRawHtml: 'Opt-in flag forwarded to @methane-ui/sanitize (defaults to false).',
  },
  eventDescriptions: {
    'mth-reply': 'Fired when an inline reply is submitted.',
    'mth-resolve-toggle': 'Fired when resolve/reopen state is toggled.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Comment card surface.' },
    { name: '--mth-color-border', description: 'Thread connector and card border.' },
  ],
};
