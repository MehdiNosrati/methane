import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const fileUploadSpec: ComponentBehaviorSpec = {
  tag: 'mth-file-upload',
  package: '@methane-ui/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'dirty', 'touched', 'invalid', 'dragover'],
  keyboard: [
    { key: 'Enter', when: 'Browse button is focused', expect: 'Opens native file chooser dialog' },
    { key: 'Space', when: 'Remove file button is focused', expect: 'Removes the corresponding file from the upload list' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'accept', attr: 'accept', type: 'string', default: '' },
    { name: 'multiple', attr: 'multiple', type: 'boolean', default: false },
    { name: 'maxFileSize', attr: 'max-file-size', type: 'number', default: 0 },
    { name: 'maxFiles', attr: 'max-files', type: 'number', default: 0 },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ files: File[]; value: string }' },
    { name: 'mth-reject', cancelable: false, detailType: '{ rejected: Array<{ file: File; reason: string }> }' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Root file upload container.' },
    { name: 'label', description: 'Optional field label.' },
    { name: 'drop-area', description: 'Interactive drag-and-drop and browse surface.' },
    { name: 'browse-button', description: 'Keyboard-accessible file picker button.' },
    { name: 'input', description: 'Hidden native file input.' },
    { name: 'list', description: 'Selected file list container.' },
    { name: 'item', description: 'Selected file row.' },
    { name: 'preview', description: 'Safe <img> thumbnail preview for image and SVG files.' },
    { name: 'remove-button', description: 'Button to remove a selected file.' },
    { name: 'error', description: 'Advisory rejection notice.' },
  ],
  messages: {
    browse: 'Choose files',
    dropHint: 'Drag files here or choose from device',
    removeFile: 'Remove file',
    requiredError: 'Select at least one file',
    rejectedNotice: 'Some files did not meet type, size, or count limits',
  },
};

export const CEM_METADATA = {
  description: 'Form-associated file upload control with advisory MIME/size checks and safe image/SVG <img> previews.',
  propDescriptions: {
    value: 'Comma-separated list of selected file names.',
    name: 'Form field name.',
    label: 'Accessible field label.',
    accept: 'Advisory comma-separated MIME types or extensions (e.g. `.png,image/*`).',
    multiple: 'Allows selecting multiple files.',
    maxFileSize: 'Advisory maximum file size in bytes (0 disables limit).',
    maxFiles: 'Advisory maximum number of files (0 disables limit).',
    disabled: 'Disables interaction.',
    readonly: 'Prevents adding or removing files.',
    required: 'Requires at least one file.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when selected files change.',
    'mth-reject': 'Fired when one or more files fail advisory checks.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Drop surface background.' },
    { name: '--mth-color-accent', description: 'Active dragover highlight border.' },
    { name: '--mth-color-border', description: 'Container border color.' },
  ],
};
