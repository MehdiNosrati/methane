import { defineComponents } from '@methane/core';
import { MthCameraCapture } from './camera-capture.js';

export {
  MthCameraCapture,
  type CameraCaptureEngine,
  type CameraCaptureResult,
  type CameraDeviceSummary,
  type CameraPermissionStatus,
} from './camera-capture.js';

export function registerMthCameraCapture(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-camera-capture': MthCameraCapture,
    },
  });
}

registerMthCameraCapture();
