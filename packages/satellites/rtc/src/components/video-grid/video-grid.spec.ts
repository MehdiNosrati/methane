import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { videoGridMessages } from './video-grid.messages.js';

export const videoGridSpec: ComponentBehaviorSpec = {
  tag: 'mth-video-grid',
  package: '@methane-ui/rtc',
  conformance: ['satellite', 'roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['speaker-layout', 'gallery-layout', 'empty'],
  keyboard: [
    {
      key: 'ArrowRight',
      dir: 'ltr',
      when: 'Focus is on a participant control in gallery or strip',
      expect: 'Moves focus to the next participant control',
    },
    {
      key: 'ArrowLeft',
      dir: 'ltr',
      when: 'Focus is on a participant control after the first item',
      expect: 'Moves focus to the previous participant control',
    },
    {
      key: 'Enter',
      when: 'Focus is on a participant pin button',
      expect: 'Toggles pin state and emits mth-pin-change',
    },
  ],
  props: [
    {
      name: 'participants',
      attr: false,
      type: 'ReadonlyArray<VideoParticipant>',
    },
    {
      name: 'layout',
      type: "'gallery' | 'speaker'",
      default: 'gallery',
    },
    {
      name: 'pinnedId',
      attr: 'pinned-id',
      type: 'string',
      default: '',
    },
    {
      name: 'activeSpeakerId',
      attr: 'active-speaker-id',
      type: 'string',
      default: '',
    },
    {
      name: 'columns',
      type: 'number',
      default: 0,
    },
    {
      name: 'label',
      type: 'string',
      default: '',
    },
  ],
  events: [
    {
      name: 'mth-pin-change',
      cancelable: false,
      detailType: '{ pinnedId: string }',
    },
    {
      name: 'mth-layout-change',
      cancelable: false,
      detailType: "{ layout: 'gallery' | 'speaker' }",
    },
  ],
  slots: [
    {
      name: 'fallback',
      description: 'Static SSR or unsupported-browser fallback content.',
    },
  ],
  parts: [
    {
      name: 'base',
      description: 'Outer region wrapper.',
    },
    {
      name: 'toolbar',
      description: 'Layout toggle toolbar.',
    },
    {
      name: 'grid',
      description: 'Participant tile grid.',
    },
    {
      name: 'tile',
      description: 'Individual participant video tile.',
    },
    {
      name: 'stage',
      description: 'Primary speaker stage container.',
    },
  ],
  messages: { ...videoGridMessages },
};

export const CEM_METADATA = {
  description: 'Accessible WebRTC participant video grid with speaker/gallery layouts and roving focus.',
  propDescriptions: {
    participants: 'Array of participant media descriptors rendered in the grid.',
    layout: 'Active layout mode: gallery grid or spotlight speaker view.',
    pinnedId: 'ID of the pinned participant.',
    activeSpeakerId: 'ID of the currently speaking participant.',
    columns: 'Explicit grid column count (0 uses responsive auto-fit).',
    label: 'Accessible region label for the video grid.',
  },
  eventDescriptions: {
    'mth-pin-change': 'Fired when a participant is pinned or unpinned.',
    'mth-layout-change': 'Fired when the user switches between gallery and speaker layout.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Tile surface color' },
    { name: '--mth-color-accent', description: 'Active speaker highlight color' },
    { name: '--mth-color-border', description: 'Tile border color' },
  ],
} as const;
