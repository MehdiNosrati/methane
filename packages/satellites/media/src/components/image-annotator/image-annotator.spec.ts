import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { ImageAnnotatorMessages } from './image-annotator.messages.js';

export const imageAnnotatorSpec: ComponentBehaviorSpec = {
  tag: 'mth-image-annotator',
  package: '@methane-ui/media',
  conformance: ['satellite', 'roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly'],
  keyboard: [
    {
      key: 'ArrowRight',
      dir: 'ltr',
      when: 'Focus is on an annotation list item',
      expect: 'Moves focus to the next annotation item',
    },
    {
      key: 'ArrowLeft',
      dir: 'ltr',
      when: 'Focus is on an annotation list item',
      expect: 'Moves focus to the previous annotation item',
    },
    {
      key: 'Delete',
      when: 'Focus is on an editable annotation item',
      expect: 'Removes the focused annotation',
    },
  ],
  props: [
    { name: 'src', type: 'string', default: '' },
    { name: 'alt', type: 'string', default: '' },
    { name: 'tool', type: "'rect' | 'arrow' | 'text' | 'freehand'", default: 'rect' },
    { name: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', type: 'boolean', default: false },
    { name: 'label', type: 'string', default: '' },
    { name: 'annotations', attr: false, type: 'readonly ImageAnnotation[]' },
  ],
  events: [
    { name: 'mth-annotation-add', cancelable: false, detailType: '{ annotation: ImageAnnotation }' },
    { name: 'mth-annotation-change', cancelable: false, detailType: '{ annotations: ImageAnnotation[] }' },
    { name: 'mth-annotation-select', cancelable: false, detailType: '{ id: string | null }' },
    { name: 'mth-tool-change', cancelable: false, detailType: '{ tool: AnnotationTool }' },
  ],
  slots: [
    { name: 'fallback', description: 'SSR or non-interactive fallback view.' },
    { name: 'toolbar', description: 'Optional extra toolbar actions.' },
  ],
  parts: [
    { name: 'base', description: 'Root workspace container.' },
    { name: 'toolbar', description: 'Drawing tool and history toolbar.' },
    { name: 'stage', description: 'Image + SVG annotation overlay viewport.' },
    { name: 'image', description: 'Annotated image element.' },
    { name: 'overlay', description: 'SVG vector annotation overlay.' },
    { name: 'annotation-list', description: 'Keyboard-navigable annotation list.' },
    { name: 'annotation-item', description: 'Individual annotation entry.' },
  ],
  messages: { ...ImageAnnotatorMessages },
};

export const CEM_METADATA = {
  description: 'Accessible SVG image annotator supporting rectangle, arrow, text, and freehand vector annotations with undo/redo.',
  propDescriptions: {
    src: 'Image source URL validated against the safe URL allowlist.',
    alt: 'Accessible alternative text for the image.',
    tool: 'Active drawing tool (rect, arrow, text, or freehand).',
    disabled: 'Disables all toolbar and annotation interactions.',
    readonly: 'Prevents mutating or adding annotations while allowing inspection.',
    label: 'Accessible region label.',
    annotations: 'Vector annotation list rendered over the image.',
  },
  eventDescriptions: {
    'mth-annotation-add': 'Fired when a new vector annotation is added.',
    'mth-annotation-change': 'Fired when annotations change via add, remove, undo, redo, or clear.',
    'mth-annotation-select': 'Fired when an annotation item is selected.',
    'mth-tool-change': 'Fired when the active drawing tool changes.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Annotator container background' },
    { name: '--mth-color-accent', description: 'Active tool button and stroke accent color' },
    { name: '--mth-color-border', description: 'Workspace border color' },
  ],
} as const;
