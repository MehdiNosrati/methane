import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { cameraCaptureMessages } from './camera-capture.messages.js';

export const cameraCaptureSpec: ComponentBehaviorSpec = {
  tag: 'mth-camera-capture',
  package: '@methane/rtc',
  conformance: ['satellite'],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['active', 'denied', 'unsupported'],
  keyboard: [
    {
      key: 'Enter',
      when: 'Focus is on Start/Stop or Capture button',
      expect: 'Triggers camera stream toggle or captures a snapshot',
    },
  ],
  props: [
    {
      name: 'facingMode',
      attr: 'facing-mode',
      type: "'user' | 'environment'",
      default: 'user',
    },
    {
      name: 'deviceId',
      attr: 'device-id',
      type: 'string',
      default: '',
    },
    {
      name: 'mimeType',
      attr: 'mime-type',
      type: 'string',
      default: 'image/png',
    },
    {
      name: 'quality',
      type: 'number',
      default: 0.92,
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: false,
    },
    {
      name: 'label',
      type: 'string',
      default: '',
    },
  ],
  events: [
    {
      name: 'mth-capture',
      cancelable: false,
      detailType: '{ dataUrl: string; width: number; height: number }',
    },
    {
      name: 'mth-permission-change',
      cancelable: false,
      detailType: '{ status: CameraPermissionStatus }',
    },
    {
      name: 'mth-device-change',
      cancelable: false,
      detailType: '{ deviceId: string }',
    },
    {
      name: 'mth-error',
      cancelable: false,
      detailType: '{ message: string }',
    },
  ],
  slots: [
    {
      name: 'fallback',
      description: 'Static SSR or camera-unavailable fallback UI.',
    },
  ],
  parts: [
    {
      name: 'base',
      description: 'Outer camera capture container.',
    },
    {
      name: 'preview',
      description: 'Live video preview element.',
    },
    {
      name: 'controls',
      description: 'Device selector and capture actions toolbar.',
    },
    {
      name: 'snapshot',
      description: 'Captured still frame preview image.',
    },
    {
      name: 'status',
      description: 'Polite live permission/capture status text.',
    },
  ],
  messages: { ...cameraCaptureMessages },
};

export const CEM_METADATA = {
  description: 'Accessible camera capture component wrapping MediaDevices.getUserMedia with graceful JSDOM/SSR fallback.',
  propDescriptions: {
    facingMode: 'Preferred camera facing mode (user or environment).',
    deviceId: 'Explicit video input device ID.',
    mimeType: 'Snapshot image MIME type.',
    quality: 'Encoder quality (0..1) for lossy image formats.',
    disabled: 'Disables camera controls.',
    label: 'Accessible region label.',
  },
  eventDescriptions: {
    'mth-capture': 'Fired when a still frame snapshot is captured.',
    'mth-permission-change': 'Fired when camera permission or stream status changes.',
    'mth-device-change': 'Fired when the selected camera device changes.',
    'mth-error': 'Fired when camera access or capture encounters an error.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Capture container surface' },
    { name: '--mth-color-accent', description: 'Primary action highlight' },
  ],
} as const;
