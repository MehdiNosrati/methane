import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const drawingPadSpec: ComponentBehaviorSpec = {
  tag: 'mth-drawing-pad',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['disabled'],
  keyboard: [
    { key: 'ArrowRight', when: 'Drawing canvas is focused', expect: 'Moves virtual drawing cursor or extends stroke when pen is active' },
    { key: 'Space', when: 'Drawing canvas is focused', expect: 'Starts or finishes a keyboard drawing stroke at cursor position' },
  ],
  props: [
    { name: 'tool', attr: 'tool', type: "'pen' | 'eraser'", default: 'pen' },
    { name: 'strokeWidth', attr: 'stroke-width', type: 'number', default: 3 },
    { name: 'strokeColor', attr: 'stroke-color', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [{ name: 'mth-change', cancelable: false, detailType: '{ strokeCount: number }' }],
  slots: [],
  parts: [
    { name: 'base', description: 'Root drawing pad container.' },
    { name: 'toolbar', description: 'Drawing tools, stroke width, undo, and clear controls.' },
    { name: 'tool-button', description: 'Pen or eraser mode button.' },
    { name: 'width-input', description: 'Stroke width range slider.' },
    { name: 'undo-button', description: 'Button to undo the last stroke.' },
    { name: 'clear-button', description: 'Button to clear all strokes.' },
    { name: 'canvas', description: 'Pointer-capture and keyboard drawing canvas.' },
  ],
  messages: {
    canvasLabel: 'Freehand drawing canvas. Press Space to toggle keyboard pen and arrows to draw.',
    penTool: 'Pen',
    eraserTool: 'Eraser',
    strokeWidthLabel: 'Stroke width',
    undo: 'Undo',
    clear: 'Clear',
  },
};

export const CEM_METADATA = {
  description: 'Accessible pointer-capture and keyboard-capable freehand canvas drawing pad with pen, eraser, stroke width, undo, and clear controls.',
  propDescriptions: {
    tool: 'Active drawing mode (`pen` or `eraser`).',
    strokeWidth: 'Stroke width in pixels.',
    strokeColor: 'Optional CSS color string for pen strokes.',
    disabled: 'Disables canvas drawing and toolbar controls.',
    label: 'Accessible canvas label.',
  },
  eventDescriptions: {
    'mth-change': 'Fired whenever strokes are added, undone, or cleared.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Canvas background surface.' },
    { name: '--mth-color-accent', description: 'Active tool highlight color.' },
    { name: '--mth-color-border', description: 'Container border color.' },
  ],
};
