import { registerMthAudioRecorder } from './element.js';

export * from './element.js';

registerMthAudioRecorder();

declare global {
  interface HTMLElementTagNameMap {
    'mth-audio-recorder': import('./audio-recorder.js').MthAudioRecorder;
  }
}
