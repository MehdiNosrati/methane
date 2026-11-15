import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { audioPlayerMessages } from './audio-player.messages.js';

export const audioPlayerSpec: ComponentBehaviorSpec = {
  tag: 'mth-audio-player',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['playing', 'paused', 'muted'],
  keyboard: [
    { key: 'Enter / Space', when: 'play/mute/rate button focused', expect: 'toggles playback, mute, or speed' },
    { key: 'ArrowLeft / ArrowRight', when: 'seek slider focused', expect: 'scrubs audio position' },
  ],
  props: [
    { name: 'src', attr: 'src', type: 'string', default: '' },
    { name: 'title', attr: 'title', type: 'string', default: '' },
    { name: 'artist', attr: 'artist', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'autoplay', attr: 'autoplay', type: 'boolean', default: false },
    { name: 'loop', attr: 'loop', type: 'boolean', default: false },
    { name: 'muted', attr: 'muted', type: 'boolean', default: false },
    { name: 'preload', attr: 'preload', type: "'metadata' | 'auto' | 'none'", default: 'metadata' },
    { name: 'playbackRate', attr: 'playback-rate', type: 'number', default: 1 },
  ],
  events: [
    { name: 'mth-play', cancelable: false, detailType: 'undefined' },
    { name: 'mth-pause', cancelable: false, detailType: 'undefined' },
    { name: 'mth-timeupdate', cancelable: false, detailType: '{ currentTime: number; duration: number }' },
    { name: 'mth-ended', cancelable: false, detailType: 'undefined' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Outer audio player bar.' },
    { name: 'audio', description: 'Hidden native HTMLAudioElement.' },
    { name: 'play-button', description: 'Play/pause button.' },
    { name: 'meta', description: 'Track title and artist block.' },
    { name: 'seek', description: 'Audio timeline slider.' },
    { name: 'time', description: 'Current time and duration label.' },
    { name: 'mute-button', description: 'Mute toggle button.' },
    { name: 'rate-button', description: 'Playback speed toggle button.' },
  ],
  messages: { ...audioPlayerMessages },
};

export const CEM_METADATA = {
  description: 'Accessible custom audio player bar with safe-URL validation, track metadata, seek slider, mute, and playback rate controls.',
  propDescriptions: {
    src: 'Audio source URL validated against safe protocols.',
    title: 'Track title shown in player bar.',
    artist: 'Optional artist or subtitle.',
    label: 'Accessible region label.',
    autoplay: 'Requests automatic playback on load.',
    loop: 'Repeats playback when audio finishes.',
    muted: 'Starts or keeps audio output muted.',
    preload: 'Native audio preload hint.',
    playbackRate: 'Playback speed multiplier.',
  },
  eventDescriptions: {
    'mth-play': 'Fired when audio starts playing.',
    'mth-pause': 'Fired when audio pauses.',
    'mth-timeupdate': 'Fired when audio time changes.',
    'mth-ended': 'Fired when audio finishes playing.',
  },
  cssProperties: [],
};
