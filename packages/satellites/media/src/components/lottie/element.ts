import { defineComponents } from '@methane-ui/core';
import { MthLottie } from './lottie.js';

export { MthLottie, LottieEngine, type LottieEngineConfig } from './lottie.js';
export { LottieMessages, type LottieMessageKey } from './lottie.messages.js';
export { lottieStyles } from './lottie.styles.js';

export function registerMthLottie(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-lottie': MthLottie,
    },
  });
}
