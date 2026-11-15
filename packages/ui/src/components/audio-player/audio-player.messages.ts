export const audioPlayerMessages = {
  playerLabel: 'Audio player',
  play: 'Play audio',
  pause: 'Pause audio',
  seekLabel: 'Seek audio timeline',
  mute: 'Mute audio',
  unmute: 'Unmute audio',
  volumeLabel: 'Audio volume',
  playbackRateLabel: 'Playback speed',
} as const satisfies Record<string, string>;

export type AudioPlayerMessages = typeof audioPlayerMessages;
