import { defineComponents } from '@methane/core';
import { MthLottie } from './lottie.js';

export { MthLottie, LottieEngine, type LottieEngineConfig } from './lottie.js';

export function registerMthLottie(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-lottie': MthLottie,
    },
  });
}

registerMthLottie();
