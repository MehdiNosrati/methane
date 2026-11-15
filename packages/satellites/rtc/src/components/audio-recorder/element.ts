import { defineComponents } from '@methane/core';
import { MthAudioRecorder } from './audio-recorder.js';

export {
  MthAudioRecorder,
  type AudioRecorderEngine,
  type AudioRecorderState,
  type AudioRecordingResult,
} from './audio-recorder.js';

export function registerMthAudioRecorder(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-audio-recorder': MthAudioRecorder,
    },
  });
}

registerMthAudioRecorder();
