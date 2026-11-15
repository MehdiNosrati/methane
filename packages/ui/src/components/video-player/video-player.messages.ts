export const videoPlayerMessages = {
  playerLabel: 'Video player',
  play: 'Play',
  pause: 'Pause',
  seekLabel: 'Seek video timeline',
  mute: 'Mute',
  unmute: 'Unmute',
  volumeLabel: 'Volume',
  playbackRateLabel: 'Playback speed',
  fullscreen: 'Toggle fullscreen',
  invalidSource: 'Video source unavailable',
} as const satisfies Record<string, string>;

export type VideoPlayerMessages = typeof videoPlayerMessages;
