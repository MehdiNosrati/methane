import { defineComponents } from '@methane-ui/core';
import { MthScreenRecorder } from './screen-recorder.js';

export {
  MthScreenRecorder,
  type ScreenRecorderEngine,
  type ScreenRecorderState,
  type ScreenRecordingResult,
} from './screen-recorder.js';
export { screenRecorderMessages } from './screen-recorder.messages.js';
export { screenRecorderStyles } from './screen-recorder.styles.js';

export function registerMthScreenRecorder(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-screen-recorder': MthScreenRecorder,
    },
  });
}
