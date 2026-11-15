import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { videoPlayerMessages } from './video-player.messages.js';

export const videoPlayerSpec: ComponentBehaviorSpec = {
  tag: 'mth-video-player',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['playing', 'paused', 'muted'],
  keyboard: [
    { key: 'Space / k', when: 'player container focused', expect: 'toggles play and pause' },
    { key: 'm', when: 'player container focused', expect: 'toggles muted state' },
    { key: 'ArrowLeft / ArrowRight', when: 'timeline slider focused', expect: 'seeks backward or forward' },
  ],
  props: [
    { name: 'src', attr: 'src', type: 'string', default: '' },
    { name: 'poster', attr: 'poster', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'autoplay', attr: 'autoplay', type: 'boolean', default: false },
    { name: 'loop', attr: 'loop', type: 'boolean', default: false },
    { name: 'muted', attr: 'muted', type: 'boolean', default: false },
    { name: 'playsinline', attr: 'playsinline', type: 'boolean', default: true },
    { name: 'preload', attr: 'preload', type: "'metadata' | 'auto' | 'none'", default: 'metadata' },
    { name: 'playbackRate', attr: 'playback-rate', type: 'number', default: 1 },
  ],
  events: [
    { name: 'mth-play', cancelable: false, detailType: 'undefined' },
    { name: 'mth-pause', cancelable: false, detailType: 'undefined' },
    { name: 'mth-timeupdate', cancelable: false, detailType: '{ currentTime: number; duration: number }' },
    { name: 'mth-ended', cancelable: false, detailType: 'undefined' },
  ],
  slots: [{ name: '', description: 'Optional caption <track> elements.' }],
  parts: [
    { name: 'base', description: 'Outer video player wrapper.' },
    { name: 'video', description: 'Native HTMLVideoElement.' },
    { name: 'controls', description: 'Control bar container.' },
    { name: 'play-button', description: 'Play/pause toggle button.' },
    { name: 'seek', description: 'Timeline seek slider.' },
    { name: 'time', description: 'Elapsed/total time readout.' },
    { name: 'mute-button', description: 'Mute toggle button.' },
    { name: 'volume', description: 'Volume range slider.' },
    { name: 'rate-button', description: 'Playback speed toggle button.' },
    { name: 'fullscreen-button', description: 'Fullscreen toggle button.' },
  ],
  messages: { ...videoPlayerMessages },
};

export const CEM_METADATA = {
  description: 'Accessible custom-chrome video player with safe-URL validation, keyboard shortcuts, timeline seek, volume, speed control, and fullscreen toggle.',
  propDescriptions: {
    src: 'Video media URL validated against safe protocols.',
    poster: 'Optional poster image URL validated against safe protocols.',
    label: 'Accessible region label for the player.',
    autoplay: 'Requests automatic playback on load.',
    loop: 'Restarts playback from the beginning when ended.',
    muted: 'Starts or keeps audio output muted.',
    playsinline: 'Requests inline playback on mobile browsers.',
    preload: 'Native media preload hint.',
    playbackRate: 'Active playback speed multiplier.',
  },
  eventDescriptions: {
    'mth-play': 'Fired when video playback starts.',
    'mth-pause': 'Fired when video playback pauses.',
    'mth-timeupdate': 'Fired when playback time advances or seeks.',
    'mth-ended': 'Fired when video playback reaches the end.',
  },
  cssProperties: [
    { name: '--mth-video-radius', description: 'Border radius override for the video player container.' },
  ],
};
