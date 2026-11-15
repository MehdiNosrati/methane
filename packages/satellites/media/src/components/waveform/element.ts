import { defineComponents } from '@methane/core';
import { MthWaveform } from './waveform.js';

export { MthWaveform, WaveformEngine, type AudioBufferLike } from './waveform.js';

export function registerMthWaveform(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-waveform': MthWaveform,
    },
  });
}

registerMthWaveform();
