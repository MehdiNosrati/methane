import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { WaveformMessages } from './waveform.messages.js';

export const waveformSpec: ComponentBehaviorSpec = {
  tag: 'mth-waveform',
  package: '@methane/media',
  conformance: ['satellite'],
  controllers: ['MotionController'],
  focusModel: 'delegates-focus',
  states: ['playing', 'disabled', 'reduced-motion'],
  keyboard: [
    {
      key: 'ArrowRight',
      dir: 'ltr',
      when: 'Focus is on the waveform scrubber',
      expect: 'Seeks forward along the audio timeline',
    },
    {
      key: 'ArrowLeft',
      dir: 'ltr',
      when: 'Focus is on the waveform scrubber',
      expect: 'Seeks backward along the audio timeline',
    },
    {
      key: 'Home',
      when: 'Focus is on the waveform scrubber',
      expect: 'Seeks to the start of the waveform',
    },
    {
      key: 'End',
      when: 'Focus is on the waveform scrubber',
      expect: 'Seeks to the end of the waveform',
    },
    {
      key: ' ',
      when: 'Focus is on the waveform scrubber',
      expect: 'Toggles audio playback',
    },
  ],
  props: [
    { name: 'src', type: 'string', default: '' },
    { name: 'playing', type: 'boolean', default: false },
    { name: 'disabled', type: 'boolean', default: false },
    { name: 'currentTime', attr: 'current-time', type: 'number', default: 0 },
    { name: 'duration', type: 'number', default: 0 },
    { name: 'barCount', attr: 'bar-count', type: 'number', default: 48 },
    { name: 'label', type: 'string', default: '' },
    { name: 'peaks', attr: false, type: 'readonly number[]' },
  ],
  events: [
    { name: 'mth-play', cancelable: false, detailType: '{ currentTime: number }' },
    { name: 'mth-pause', cancelable: false, detailType: '{ currentTime: number }' },
    { name: 'mth-seek', cancelable: false, detailType: '{ currentTime: number; progress: number }' },
    { name: 'mth-error', cancelable: false, detailType: '{ reason: string }' },
  ],
  slots: [
    { name: 'fallback', description: 'SSR and non-interactive fallback content.' },
    { name: 'controls', description: 'Optional extra playback controls.' },
  ],
  parts: [
    { name: 'base', description: 'Root container.' },
    { name: 'controls', description: 'Playback control bar.' },
    { name: 'play-button', description: 'Play/pause toggle button.' },
    { name: 'scrubber', description: 'Keyboard-accessible seekable waveform track.' },
    { name: 'bars', description: 'SVG bar visualization.' },
    { name: 'progress', description: 'Playback progress indicator.' },
    { name: 'time', description: 'Current time and total duration readout.' },
  ],
  messages: { ...WaveformMessages },
};

export const CEM_METADATA = {
  description: 'Accessible audio waveform visualizer and keyboard-scrubbable seekbar.',
  propDescriptions: {
    src: 'Media audio source URL validated against the safe URL allowlist.',
    playing: 'Whether audio playback is currently active.',
    disabled: 'Disables interactive scrubbing and playback controls.',
    currentTime: 'Current playback time in seconds.',
    duration: 'Total media duration in seconds.',
    barCount: 'Number of normalized amplitude bars rendered in the waveform.',
    label: 'Accessible region label.',
    peaks: 'Precomputed amplitude peak array (0..1).',
  },
  eventDescriptions: {
    'mth-play': 'Fired when playback starts.',
    'mth-pause': 'Fired when playback pauses.',
    'mth-seek': 'Fired when the playback position changes.',
    'mth-error': 'Fired when an invalid or unsafe source URL is rejected.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Waveform container background' },
    { name: '--mth-color-accent', description: 'Played bars and scrubber indicator color' },
    { name: '--mth-color-border', description: 'Unplayed bars and container border color' },
  ],
} as const;
