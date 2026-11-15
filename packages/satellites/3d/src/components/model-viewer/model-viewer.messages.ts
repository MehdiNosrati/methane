export const modelViewerMessages = {
  viewerLabel: 'Interactive 3D model viewer',
  controlsLabel: '3D camera controls',
  zoomIn: 'Zoom in camera',
  zoomOut: 'Zoom out camera',
  resetCamera: 'Reset camera view',
  toggleAutoRotate: 'Toggle auto-rotation',
  loadingLabel: 'Loading 3D model...',
  invalidUrlError: 'Blocked unsafe 3D model URL',
} as const;

export type ModelViewerMessageKey = keyof typeof modelViewerMessages;
