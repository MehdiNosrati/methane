import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { thinkingIndicatorMessages } from './thinking-indicator.messages.js';

export const thinkingIndicatorSpec: ComponentBehaviorSpec = {
  tag: 'mth-thinking-indicator',
  package: '@methane/ai',
  conformance: [],
  controllers: ['MotionController'],
  focusModel: 'none',
  states: ['open', 'streaming'],
  keyboard: [
    { key: 'Enter', when: 'trigger button focused', expect: 'toggles reasoning panel open/closed' },
    { key: 'Space', when: 'trigger button focused', expect: 'toggles reasoning panel open/closed' },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'streaming', attr: 'streaming', type: 'boolean', default: false },
    { name: 'elapsedSeconds', attr: 'elapsed-seconds', type: 'number', default: 0 },
    { name: 'summary', attr: 'summary', type: 'string', default: '' },
    { name: 'content', attr: 'content', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-toggle', cancelable: false, detailType: '{ open: boolean }' },
    { name: 'mth-open', cancelable: true, detailType: 'void' },
    { name: 'mth-after-open', cancelable: false, detailType: 'void' },
    { name: 'mth-close', cancelable: true, detailType: 'void' },
    { name: 'mth-after-close', cancelable: false, detailType: 'void' },
  ],
  slots: [{ name: '', description: 'Optional detailed reasoning text or blocks.' }],
  parts: [
    { name: 'base', description: 'Outer disclosure card container.' },
    { name: 'trigger', description: 'Expand/collapse summary button.' },
    { name: 'panel', description: 'Collapsible `role="region"` reasoning panel.' },
  ],
  messages: { ...thinkingIndicatorMessages },
};

export const CEM_METADATA = {
  description:
    'Collapsible AI reasoning/chain-of-thought disclosure with elapsed timing and MotionController reduced-motion support.',
  propDescriptions: {
    open: 'Controls whether the reasoning panel is expanded.',
    streaming: 'Displays active thinking spinner while reasoning streams.',
    elapsedSeconds: 'Formatted reasoning duration in seconds.',
    summary: 'Custom disclosure heading overriding default localized label.',
    content: 'Plain-text reasoning summary shown inside the disclosure panel.',
  },
  eventDescriptions: {
    'mth-toggle': 'Fired when the user toggles the disclosure state.',
    'mth-open': 'Cancelable motion lifecycle event before expanding.',
    'mth-after-open': 'Fired after expansion completes.',
    'mth-close': 'Cancelable motion lifecycle event before collapsing.',
    'mth-after-close': 'Fired after collapse completes.',
  },
  cssProperties: [
    { name: '--mth-color-bg-subtle', description: 'Disclosure container background color.' },
    { name: '--mth-color-border', description: 'Disclosure border color.' },
    { name: '--mth-radius-md', description: 'Disclosure corner radius.' },
  ],
};
