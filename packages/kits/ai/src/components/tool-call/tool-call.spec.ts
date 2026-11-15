import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { toolCallMessages } from './tool-call.messages.js';

export const toolCallSpec: ComponentBehaviorSpec = {
  tag: 'mth-tool-call',
  package: '@methane/ai',
  conformance: [],
  controllers: ['MotionController'],
  focusModel: 'none',
  states: ['open', 'pending', 'running', 'success', 'error'],
  keyboard: [
    { key: 'Enter', when: 'trigger button focused', expect: 'expands or collapses tool details' },
    { key: 'Space', when: 'trigger button focused', expect: 'expands or collapses tool details' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    {
      name: 'status',
      attr: 'status',
      type: "'pending' | 'running' | 'success' | 'error'",
      default: 'pending',
    },
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'args', attr: false, type: 'unknown', default: undefined },
    { name: 'output', attr: false, type: 'unknown', default: undefined },
    { name: 'durationMs', attr: 'duration-ms', type: 'number | null', default: null },
  ],
  events: [
    { name: 'mth-toggle', cancelable: false, detailType: '{ open: boolean; status: string }' },
  ],
  slots: [{ name: '', description: 'Optional supplementary result content.' }],
  parts: [
    { name: 'base', description: 'Root tool card container.' },
    { name: 'trigger', description: 'Collapsible header button.' },
    { name: 'details', description: 'Expanded arguments and output container.' },
    { name: 'args', description: 'Formatted tool arguments `<pre>` block.' },
    { name: 'output', description: 'Formatted tool output `<pre>` block.' },
  ],
  messages: { ...toolCallMessages },
};

export const CEM_METADATA = {
  description:
    'Collapsible AI tool invocation card displaying execution status, escaped JSON arguments, and sanitized text output.',
  propDescriptions: {
    name: 'Invoked tool function name.',
    status: 'Current tool status (`pending` | `running` | `success` | `error`).',
    open: 'Whether arguments and output details are expanded.',
    args: 'JSON-serializable arguments payload.',
    output: 'JSON-serializable or text output payload.',
    durationMs: 'Optional execution latency in milliseconds.',
  },
  eventDescriptions: {
    'mth-toggle': 'Fired when the user toggles the tool details panel.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Tool card background color.' },
    { name: '--mth-color-border', description: 'Tool card border color.' },
    { name: '--mth-radius-md', description: 'Tool card corner radius.' },
  ],
};
