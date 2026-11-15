import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const dropzoneSpec: ComponentBehaviorSpec = {
  tag: 'mth-dropzone',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['disabled', 'dragover'],
  keyboard: [
    { key: 'Enter', when: 'Dropzone trigger button is focused', expect: 'Opens the native file chooser dialog' },
    { key: 'Space', when: 'Dropzone trigger button is focused', expect: 'Opens the native file chooser dialog' },
  ],
  props: [
    { name: 'accept', attr: 'accept', type: 'string', default: '' },
    { name: 'multiple', attr: 'multiple', type: 'boolean', default: true },
    { name: 'maxFileSize', attr: 'max-file-size', type: 'number', default: 0 },
    { name: 'maxFiles', attr: 'max-files', type: 'number', default: 0 },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-drop', cancelable: false, detailType: '{ files: File[] }' },
    { name: 'mth-reject', cancelable: false, detailType: '{ rejected: Array<{ file: File; reason: string }> }' },
  ],
  slots: [{ name: '', description: 'Custom instructional content inside the dropzone.' }],
  parts: [
    { name: 'base', description: 'Root dropzone region.' },
    { name: 'trigger', description: 'Keyboard-accessible button to open the file chooser.' },
    { name: 'input', description: 'Hidden native file input.' },
  ],
  messages: {
    browse: 'Browse files',
    prompt: 'Drop files here to upload',
  },
};

export const CEM_METADATA = {
  description: 'Accessible drag-and-drop file dropzone with advisory MIME/size checks and keyboard file dialog trigger.',
  propDescriptions: {
    accept: 'Advisory comma-separated MIME types or extensions.',
    multiple: 'Allows dropping or selecting multiple files.',
    maxFileSize: 'Advisory maximum size in bytes per file (0 disables limit).',
    maxFiles: 'Advisory maximum number of files per drop (0 disables limit).',
    disabled: 'Disables drag-and-drop and dialog interaction.',
    label: 'Accessible region label.',
  },
  eventDescriptions: {
    'mth-drop': 'Fired with accepted files when files are dropped or chosen.',
    'mth-reject': 'Fired when files fail advisory checks.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Dropzone background.' },
    { name: '--mth-color-accent', description: 'Active dragover border color.' },
    { name: '--mth-color-border', description: 'Default border color.' },
  ],
};
