export const pdfViewerMessages = {
  viewerLabel: 'PDF document viewer',
  toolbarLabel: 'PDF viewer controls',
  prevPage: 'Previous page',
  nextPage: 'Next page',
  pageNumber: 'Current page number',
  zoomLabel: 'Zoom level',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  zoomAuto: 'Auto zoom',
  zoomPageFit: 'Page fit',
  zoomPageWidth: 'Page width',
  searchLabel: 'Search document text',
  searchPlaceholder: 'Find in document...',
  outlineToggle: 'Toggle document outline',
  outlineLabel: 'Document outline',
  outlineEmpty: 'No document outline available',
  downloadLabel: 'Download PDF',
  loadingLabel: 'Loading PDF document...',
  invalidUrlError: 'Blocked unsafe PDF source URL',
} as const;

export type PdfViewerMessageKey = keyof typeof pdfViewerMessages;
