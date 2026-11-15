export const WaveformMessages = {
  regionLabel: 'Audio waveform player',
  playLabel: 'Play audio',
  pauseLabel: 'Pause audio',
  scrubberLabel: 'Audio timeline scrubber',
  fallbackLabel: 'Audio waveform preview unavailable',
  unsafeSourceError: 'Blocked unsafe media source URL',
  reducedMotionBadge: 'Reduced motion active',
} as const;

export type WaveformMessageKey = keyof typeof WaveformMessages;
