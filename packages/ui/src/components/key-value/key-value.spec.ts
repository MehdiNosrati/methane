import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const keyValueSpec: ComponentBehaviorSpec = {
  tag: 'mth-key-value',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['copied', 'monospace'],
  keyboard: [
    {
      key: 'Enter',
      when: 'Copy button is focused',
      expect: 'Copies value to clipboard and emits mth-copy',
    },
    {
      key: ' ',
      when: 'Copy button is focused',
      expect: 'Copies value to clipboard and emits mth-copy',
    },
  ],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'orientation', attr: 'orientation', type: "'horizontal' | 'vertical'", default: 'horizontal' },
    { name: 'copyable', attr: 'copyable', type: 'boolean', default: false },
    { name: 'monospace', attr: 'monospace', type: 'boolean', default: false },
  ],
  events: [
    {
      name: 'mth-copy',
      cancelable: false,
      detailType: '{ value: string; ok: boolean }',
    },
  ],
  slots: [
    { name: 'label', description: 'Key/label content.' },
    { name: '', description: 'Value content.' },
    { name: 'suffix', description: 'Optional trailing action or metadata.' },
  ],
  parts: [
    { name: 'base', description: 'Outer `<dl>` key-value container.' },
    { name: 'label', description: 'Key `<dt>` container.' },
    { name: 'value', description: 'Value `<dd>` container.' },
    { name: 'copy', description: 'Copy button rendered when `copyable` is true.' },
  ],
  messages: {
    copyLabel: 'Copy value',
    copyLabelNamed: 'Copy {label}',
    copiedLabel: 'Copied',
    copiedAnnouncement: 'Copied to clipboard',
  },
};

export const CEM_METADATA = {
  description: 'Accessible semantic `<dl>`/`<dt>`/`<dd>` key-value pair with horizontal/vertical layout, monospace formatting, and one-click clipboard copy.',
  propDescriptions: {
    label: 'Key label text when `label` slot is not provided.',
    value: 'Value text when default slot is not provided.',
    orientation: 'Arrangement of label and value (`horizontal` or `vertical`).',
    copyable: 'Displays a clipboard copy button next to the value.',
    monospace: 'Renders the value in a monospace font stack.',
  },
  eventDescriptions: {
    'mth-copy': 'Emitted after attempting to copy the value to the clipboard.',
  },
  cssProperties: [
    { name: '--mth-color-fg-muted', description: 'Label text color.' },
    { name: '--mth-color-fg', description: 'Value text color.' },
    { name: '--mth-space-2', description: 'Gap between label and value.' },
  ],
};
