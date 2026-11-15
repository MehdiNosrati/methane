import { registerMthLottie } from './element.js';

export * from './element.js';

registerMthLottie();

declare global {
  interface HTMLElementTagNameMap {
    'mth-lottie': import('./lottie.js').MthLottie;
  }
}
