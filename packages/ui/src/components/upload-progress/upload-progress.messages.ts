export const uploadProgressMessages = {
  queuedLabel: 'Queued',
  uploadingLabel: 'Uploading ({percent}%)',
  pausedLabel: 'Paused',
  completeLabel: 'Uploaded',
  errorLabel: 'Upload failed',
  pauseLabel: 'Pause upload',
  resumeLabel: 'Resume upload',
  cancelLabel: 'Cancel upload',
  retryLabel: 'Retry upload',
  defaultFilename: 'Untitled file',
} as const satisfies Record<string, string>;
