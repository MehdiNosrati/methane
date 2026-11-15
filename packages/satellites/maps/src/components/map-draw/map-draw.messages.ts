import type { MessageCatalog } from '@methane/core';

export const mapDrawMessages = {
  regionLabel: 'Map drawing editor',
  toolbarLabel: 'Drawing tools',
  modeSelect: 'Select',
  modePoint: 'Point',
  modeLine: 'Line',
  modePolygon: 'Polygon',
  finishDraft: 'Finish shape',
  undoAction: 'Undo',
  redoAction: 'Redo',
  clearAction: 'Clear',
  surfaceLabel: 'Drawing canvas',
  statusSummary: '{count} features drawn ({vertices} draft vertices)',
} satisfies MessageCatalog;
