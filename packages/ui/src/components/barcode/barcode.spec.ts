import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { barcodeMessages } from './barcode.messages.js';

export const barcodeSpec: ComponentBehaviorSpec = {
  tag: 'mth-barcode',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: [],
  keyboard: [],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'height', attr: 'height', type: 'number', default: 56 },
    { name: 'showValue', attr: 'show-value', type: 'boolean', default: true },
  ],
  events: [],
  slots: [],
  parts: [
    { name: 'base', description: 'Outer barcode figure wrapper.' },
    { name: 'svg', description: 'Deterministic Code 128 SVG element.' },
    { name: 'caption', description: 'Human-readable encoded text.' },
  ],
  messages: { ...barcodeMessages },
};

export const CEM_METADATA = {
  description: 'Zero-dependency deterministic ISO/IEC 15417 Code 128B SVG barcode generator with accessible label and optional caption.',
  propDescriptions: {
    value: 'ASCII text encoded as Code 128B bars.',
    label: 'Accessible alternative text describing the barcode.',
    height: 'Bar block height in SVG user units/CSS pixels.',
    showValue: 'Displays the human-readable encoded string beneath the bars.',
  },
  eventDescriptions: {},
  cssProperties: [
    { name: '--mth-barcode-fg', description: 'Barcode ink color override.' },
    { name: '--mth-barcode-bg', description: 'Barcode background color override.' },
  ],
};
