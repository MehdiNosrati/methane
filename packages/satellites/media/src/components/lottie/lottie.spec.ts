import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { LottieMessages } from './lottie.messages.js';

export const lottieSpec: ComponentBehaviorSpec = {
  tag: 'mth-lottie',
  package: '@methane/media',
  conformance: ['satellite'],
  controllers: ['MotionController'],
  focusModel: 'delegates-focus',
  states: ['playing', 'frozen', 'disabled'],
  keyboard: [
    {
      key: 'Enter',
      when: 'Focus is on the play/pause button',
      expect: 'Toggles animation playback unless prefers-reduced-motion is active',
    },
  ],
  props: [
    { name: 'src', type: 'string', default: '' },
    { name: 'autoplay', type: 'boolean', default: false },
    { name: 'loop', type: 'boolean', default: true },
    { name: 'speed', type: 'number', default: 1 },
    { name: 'playing', type: 'boolean', default: false },
    { name: 'controls', type: 'boolean', default: true },
    { name: 'disabled', type: 'boolean', default: false },
    { name: 'label', type: 'string', default: '' },
    { name: 'animationData', attr: false, type: 'DotLottieConfig["data"] | undefined' },
  ],
  events: [
    { name: 'mth-play', cancelable: false, detailType: '{ speed: number; loop: boolean }' },
    { name: 'mth-pause', cancelable: false, detailType: '{ speed: number }' },
    { name: 'mth-stop', cancelable: false, detailType: 'void' },
    { name: 'mth-error', cancelable: false, detailType: '{ reason: string }' },
  ],
  slots: [
    { name: 'fallback', description: 'SSR or reduced-motion fallback graphic.' },
  ],
  parts: [
    { name: 'base', description: 'Outer animation container.' },
    { name: 'canvas', description: 'DotLottie rendering canvas.' },
    { name: 'controls', description: 'Playback control bar.' },
    { name: 'play-button', description: 'Play/pause button.' },
    { name: 'stop-button', description: 'Stop button.' },
  ],
  messages: { ...LottieMessages },
};

export const CEM_METADATA = {
  description: 'Accessible DotLottie animation player wrapping @lottiefiles/dotlottie-web with reduced-motion support.',
  propDescriptions: {
    src: 'Animation asset URL validated against the safe URL allowlist.',
    autoplay: 'Starts animation automatically unless prefers-reduced-motion is active.',
    loop: 'Repeats the animation continuously.',
    speed: 'Playback speed multiplier (> 0).',
    playing: 'Whether playback is active.',
    controls: 'Displays built-in play/pause and stop controls.',
    disabled: 'Disables playback controls.',
    label: 'Accessible region label.',
    animationData: 'Inline Lottie JSON/buffer payload passed to DotLottie.',
  },
  eventDescriptions: {
    'mth-play': 'Fired when animation playback starts.',
    'mth-pause': 'Fired when animation playback pauses.',
    'mth-stop': 'Fired when animation playback stops.',
    'mth-error': 'Fired when an invalid source URL is blocked.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Player card background' },
    { name: '--mth-color-accent', description: 'Primary play button background' },
    { name: '--mth-color-border', description: 'Container border color' },
  ],
} as const;
