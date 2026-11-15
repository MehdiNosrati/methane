import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { uploadProgressMessages } from './upload-progress.messages.js';

export const uploadProgressSpec: ComponentBehaviorSpec = {
  tag: 'mth-upload-progress',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['queued', 'uploading', 'paused', 'complete', 'error'],
  keyboard: [],
  props: [
    { name: 'filename', attr: 'filename', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'number', default: 0 },
    { name: 'size', attr: 'size', type: 'number', default: 0 },
    {
      name: 'status',
      attr: 'status',
      type: "'queued' | 'uploading' | 'paused' | 'complete' | 'error'",
      default: 'queued',
    },
    { name: 'errorMessage', attr: 'error-message', type: 'string', default: '' },
    { name: 'pausable', attr: 'pausable', type: 'boolean', default: true },
    { name: 'cancellable', attr: 'cancellable', type: 'boolean', default: true },
  ],
  events: [
    { name: 'mth-pause', cancelable: false, detailType: 'undefined' },
    { name: 'mth-resume', cancelable: false, detailType: 'undefined' },
    { name: 'mth-cancel', cancelable: false, detailType: 'undefined' },
    { name: 'mth-retry', cancelable: false, detailType: 'undefined' },
  ],
  slots: [
    { name: 'icon', description: 'Optional file type icon.' },
    { name: 'actions', description: 'Optional extra action controls.' },
  ],
  parts: [
    { name: 'base', description: 'Upload progress card container.' },
    { name: 'meta', description: 'Filename, formatted byte size, and status line.' },
    { name: 'filename', description: 'File name text.' },
    { name: 'status-text', description: 'Current transfer status or error copy.' },
    { name: 'track', description: 'Progress bar track.' },
    { name: 'fill', description: 'Progress bar fill scaled via `--_upload-pct`.' },
    { name: 'controls', description: 'Pause/resume, retry, and cancel action buttons.' },
    { name: 'pause-button', description: 'Pause or resume button.' },
    { name: 'retry-button', description: 'Retry button on upload failure.' },
    { name: 'cancel-button', description: 'Cancel button.' },
  ],
  messages: { ...uploadProgressMessages },
};

export const CEM_METADATA = {
  description:
    'File upload progress row displaying filename, size, CSP-safe adopted stylesheet progress bar, pause/resume/cancel/retry controls, and accessible `progressbar` state.',
  propDescriptions: {
    filename: 'Display name of the uploading file.',
    value: 'Percentage complete between 0 and 100.',
    size: 'Optional file size in bytes.',
    status: 'Transfer status (`queued`, `uploading`, `paused`, `complete`, or `error`).',
    errorMessage: 'Error description displayed when `status="error"`.',
    pausable: 'Enables pause/resume controls while uploading or paused.',
    cancellable: 'Enables the cancel button while not yet complete.',
  },
  eventDescriptions: {
    'mth-pause': 'Fired when pausing an active upload.',
    'mth-resume': 'Fired when resuming a paused upload.',
    'mth-cancel': 'Fired when cancelling the upload.',
    'mth-retry': 'Fired when retrying a failed upload.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Card surface color' },
    { name: '--mth-color-fg', description: 'Foreground text color' },
    { name: '--mth-color-border', description: 'Border and track color' },
    { name: '--mth-color-accent', description: 'Uploading fill color' },
    { name: '--mth-color-success', description: 'Complete fill color' },
    { name: '--mth-color-danger', description: 'Error fill and text color' },
  ],
};
