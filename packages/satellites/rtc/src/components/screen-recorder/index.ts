import { registerMthScreenRecorder } from './element.js';

export * from './element.js';

registerMthScreenRecorder();

declare global {
  interface HTMLElementTagNameMap {
    'mth-screen-recorder': import('./screen-recorder.js').MthScreenRecorder;
  }
}
