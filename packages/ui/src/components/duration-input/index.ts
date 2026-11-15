import { registerMthDurationInput } from './element.js';

export * from './element.js';

registerMthDurationInput();

declare global {
  interface HTMLElementTagNameMap {
    'mth-duration-input': import('./duration-input.js').MthDurationInput;
  }
}
