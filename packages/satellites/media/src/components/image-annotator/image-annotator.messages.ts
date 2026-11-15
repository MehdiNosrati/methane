export const ImageAnnotatorMessages = {
  regionLabel: 'Image annotation workspace',
  toolbarLabel: 'Annotation tools',
  rectTool: 'Rectangle',
  arrowTool: 'Arrow',
  textTool: 'Text note',
  freehandTool: 'Freehand',
  undoLabel: 'Undo',
  redoLabel: 'Redo',
  clearLabel: 'Clear all',
  annotationListLabel: 'Annotations',
  emptyAnnotations: 'No annotations yet',
  unsafeSourceError: 'Blocked unsafe image source URL',
} as const;

export type ImageAnnotatorMessageKey = keyof typeof ImageAnnotatorMessages;
