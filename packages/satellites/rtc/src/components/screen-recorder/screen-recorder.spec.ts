import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { screenRecorderMessages } from './screen-recorder.messages.js';

export const screenRecorderSpec: ComponentBehaviorSpec = {
  tag: 'mth-screen-recorder',
  package: '@methane/rtc',
  conformance: ['satellite'],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['recording', 'paused', 'stopped', 'unsupported'],
  keyboard: [
    {
      key: 'Enter',
      when: 'Focus is on Share, Pause, Resume, or Stop button',
      expect: 'Transitions screen recorder state and emits mth-state-change',
    },
  ],
  props: [
    {
      name: 'systemAudio',
      attr: 'system-audio',
      type: 'boolean',
      default: true,
    },
    {
      name: 'mimeType',
      attr: 'mime-type',
      type: 'string',
      default: 'video/webm',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: false,
    },
    {
      name: 'label',
      type: 'string',
      default: '',
    },
  ],
  events: [
    {
      name: 'mth-state-change',
      cancelable: false,
      detailType: '{ state: ScreenRecorderState }',
    },
    {
      name: 'mth-record-complete',
      cancelable: false,
      detailType: '{ blob: Blob | null; url: string; durationMs: number; mimeType: string; systemAudio: boolean }',
    },
    {
      name: 'mth-error',
      cancelable: false,
      detailType: '{ message: string }',
    },
  ],
  slots: [
    {
      name: 'fallback',
      description: 'Static SSR or unsupported-browser fallback UI.',
    },
  ],
  parts: [
    {
      name: 'base',
      description: 'Outer screen recorder region.',
    },
    {
      name: 'controls',
      description: 'Screen capture controls and system audio toggle.',
    },
    {
      name: 'timer',
      description: 'Elapsed screen recording duration.',
    },
    {
      name: 'status',
      description: 'Polite screen capture status readout.',
    },
  ],
  messages: { ...screenRecorderMessages },
};

export const CEM_METADATA = {
  description: 'Accessible getDisplayMedia + MediaRecorder screen capture control with system audio toggle and SSR fallback.',
  propDescriptions: {
    systemAudio: 'Requests system/tab audio when starting display capture.',
    mimeType: 'Preferred recorded video MIME type.',
    disabled: 'Disables screen capture controls.',
    label: 'Accessible region label.',
  },
  eventDescriptions: {
    'mth-state-change': 'Fired when screen recorder state changes.',
    'mth-record-complete': 'Fired when screen recording stops with output payload.',
    'mth-error': 'Fired on permission or display-capture errors.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Recorder container background' },
    { name: '--mth-color-accent', description: 'Primary share action highlight' },
  ],
} as const;
