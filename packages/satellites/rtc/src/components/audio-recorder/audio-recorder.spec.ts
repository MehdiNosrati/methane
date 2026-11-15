import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { audioRecorderMessages } from './audio-recorder.messages.js';

export const audioRecorderSpec: ComponentBehaviorSpec = {
  tag: 'mth-audio-recorder',
  package: '@methane/rtc',
  conformance: ['satellite'],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['recording', 'paused', 'stopped', 'unsupported'],
  keyboard: [
    {
      key: 'Enter',
      when: 'Focus is on Record, Pause, Resume, or Stop button',
      expect: 'Transitions recorder state and emits mth-state-change',
    },
  ],
  props: [
    {
      name: 'mimeType',
      attr: 'mime-type',
      type: 'string',
      default: 'audio/webm',
    },
    {
      name: 'maxDuration',
      attr: 'max-duration',
      type: 'number',
      default: 0,
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
      detailType: '{ state: AudioRecorderState }',
    },
    {
      name: 'mth-record-complete',
      cancelable: false,
      detailType: '{ blob: Blob | null; url: string; durationMs: number; mimeType: string }',
    },
    {
      name: 'mth-level',
      cancelable: false,
      detailType: '{ level: number }',
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
      description: 'Outer audio recorder region.',
    },
    {
      name: 'controls',
      description: 'Transport control buttons.',
    },
    {
      name: 'meter',
      description: 'Accessible audio input level meter.',
    },
    {
      name: 'timer',
      description: 'Elapsed recording duration readout.',
    },
    {
      name: 'status',
      description: 'Polite recorder status region.',
    },
  ],
  messages: { ...audioRecorderMessages },
};

export const CEM_METADATA = {
  description: 'Accessible MediaRecorder audio capture control with pause/resume, live input level meter, and duration limit.',
  propDescriptions: {
    mimeType: 'Preferred audio recording MIME type.',
    maxDuration: 'Maximum recording duration in seconds (0 for unlimited).',
    disabled: 'Disables recorder controls.',
    label: 'Accessible region label.',
  },
  eventDescriptions: {
    'mth-state-change': 'Fired when recorder state transitions.',
    'mth-record-complete': 'Fired when recording stops with blob/URL/duration payload.',
    'mth-level': 'Fired when input level updates.',
    'mth-error': 'Fired on microphone or recorder errors.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Recorder container background' },
    { name: '--mth-color-danger', description: 'Active recording indicator color' },
    { name: '--mth-color-accent', description: 'Audio level meter fill color' },
  ],
} as const;
