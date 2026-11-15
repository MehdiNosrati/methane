import { registerMthWaveform } from './element.js';

export * from './element.js';

registerMthWaveform();

declare global {
  interface HTMLElementTagNameMap {
    'mth-waveform': import('./waveform.js').MthWaveform;
  }
}
