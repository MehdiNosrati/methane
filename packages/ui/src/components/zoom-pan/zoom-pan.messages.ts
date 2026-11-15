export const zoomPanMessages = {
  viewportLabel: 'Zoomable viewport',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  reset: 'Reset zoom',
} as const satisfies Record<string, string>;

export type ZoomPanMessages = typeof zoomPanMessages;
