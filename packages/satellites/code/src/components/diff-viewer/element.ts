import { defineComponents } from '@methane-ui/core';
import { MthDiffViewer } from './diff-viewer.js';

export { MthDiffViewer, type DiffViewerEngine } from './diff-viewer.js';
export { diffViewerMessages } from './diff-viewer.messages.js';
export { diffViewerStyles } from './diff-viewer.styles.js';

export function registerMthDiffViewer(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-diff-viewer': MthDiffViewer },
  });
}
