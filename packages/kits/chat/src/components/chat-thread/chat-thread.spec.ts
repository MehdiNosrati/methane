import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { chatThreadMessages } from './chat-thread.messages.js';

export const chatThreadSpec: ComponentBehaviorSpec = {
  tag: 'mth-chat-thread',
  package: '@methane/chat',
  conformance: [],
  controllers: ['VirtualizerController', 'DataController'],
  focusModel: 'none',
  states: ['loading', 'empty', 'error'],
  keyboard: [],
  props: [
    { name: 'messages', attr: false, type: 'ReadonlyArray<ChatMessage>' },
    { name: 'dataSource', attr: false, type: 'DataSource<ChatMessage> | null', default: null },
    { name: 'estimateHeight', attr: 'estimate-height', type: 'number', default: 72 },
    { name: 'overscan', attr: 'overscan', type: 'number', default: 4 },
    { name: 'unreadMessageId', attr: 'unread-message-id', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'showScrollToBottom', attr: 'show-scroll-to-bottom', type: 'boolean', default: true },
    { name: 'allowRawHtml', attr: 'allow-raw-html', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-scroll-bottom', cancelable: false, detailType: 'undefined' },
    { name: 'mth-retry', cancelable: false, detailType: 'undefined' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Outer thread region.' },
    { name: 'scroller', description: 'Virtualized scroll viewport.' },
    { name: 'stream', description: 'Windowed message stream container.' },
    { name: 'date-separator', description: 'Localized UTC date group divider.' },
    { name: 'unread-divider', description: 'Unread boundary divider.' },
    { name: 'message', description: 'Message article container.' },
    { name: 'message-author', description: 'Sender name.' },
    { name: 'message-body', description: 'Sanitized message content.' },
    { name: 'scroll-bottom', description: 'Jump-to-latest anchor button.' },
  ],
  messages: { ...chatThreadMessages },
};

export const CEM_METADATA = {
  description:
    'Virtualized chat message stream with VirtualizerController, DataController support, date/unread dividers, sanitized markdown bodies, and scroll-to-bottom anchor.',
  propDescriptions: {
    messages: 'Inline list of chat messages rendered when no DataSource is active.',
    dataSource: 'Optional async DataSource<ChatMessage> backing DataController.',
    estimateHeight: 'Estimated pixel height per message row for windowing.',
    overscan: 'Extra offscreen message count rendered above and below viewport.',
    unreadMessageId: 'Message ID before which the unread divider is placed.',
    label: 'Accessible region label for the conversation log.',
    showScrollToBottom: 'Displays the scroll-to-bottom button.',
    allowRawHtml: 'Opt-in flag forwarded to @methane/sanitize markdown renderer (defaults to false).',
  },
  eventDescriptions: {
    'mth-scroll-bottom': 'Fired when user activates the scroll-to-bottom anchor.',
    'mth-retry': 'Fired when user clicks retry on a DataSource error state.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Message surface background.' },
    { name: '--mth-color-accent-subtle', description: 'Self-authored message bubble highlight.' },
  ],
};
