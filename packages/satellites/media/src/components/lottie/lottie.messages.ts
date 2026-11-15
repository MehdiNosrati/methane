export const LottieMessages = {
  regionLabel: 'Lottie animation player',
  playLabel: 'Play animation',
  pauseLabel: 'Pause animation',
  stopLabel: 'Stop animation',
  reducedMotionLabel: 'Animation paused for reduced motion',
  unsafeSourceError: 'Blocked unsafe Lottie source URL',
} as const;

export type LottieMessageKey = keyof typeof LottieMessages;
