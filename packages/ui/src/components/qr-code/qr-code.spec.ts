import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { qrCodeMessages } from './qr-code.messages.js';

export const qrCodeSpec: ComponentBehaviorSpec = {
  tag: 'mth-qr-code',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: [],
  keyboard: [],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'size', attr: 'size', type: 'number', default: 160 },
    { name: 'errorCorrection', attr: 'error-correction', type: "'L' | 'M' | 'Q' | 'H'", default: 'M' },
    { name: 'quietZone', attr: 'quiet-zone', type: 'number', default: 2 },
  ],
  events: [],
  slots: [],
  parts: [
    { name: 'base', description: 'Outer QR code figure container.' },
    { name: 'svg', description: 'Deterministic SVG matrix element.' },
  ],
  messages: { ...qrCodeMessages },
};

export const CEM_METADATA = {
  description: 'Zero-dependency deterministic SVG QR Code generator (ISO/IEC 18004 Byte mode with Reed-Solomon ECC) and accessible label.',
  propDescriptions: {
    value: 'Payload string encoded into the QR code.',
    label: 'Accessible alternative text describing what the QR code links to or encodes.',
    size: 'Rendered square inline/block dimension in CSS pixels.',
    errorCorrection: 'QR Reed-Solomon error correction level (L, M, Q, or H).',
    quietZone: 'Quiet-zone border width in QR modules.',
  },
  eventDescriptions: {},
  cssProperties: [
    { name: '--mth-qr-fg', description: 'Foreground module color override.' },
    { name: '--mth-qr-bg', description: 'Background quiet-zone color override.' },
  ],
};
