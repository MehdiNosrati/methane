import { defineComponents } from '@methane-ui/core';
import { MthCameraCapture } from './camera-capture.js';

export {
  MthCameraCapture,
  type CameraCaptureEngine,
  type CameraCaptureResult,
  type CameraDeviceSummary,
  type CameraPermissionStatus,
} from './camera-capture.js';
export { cameraCaptureMessages } from './camera-capture.messages.js';
export { cameraCaptureStyles } from './camera-capture.styles.js';

export function registerMthCameraCapture(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-camera-capture': MthCameraCapture,
    },
  });
}
