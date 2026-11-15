import { defineComponents } from '@methane-ui/core';
import { MthFileExplorer } from './file-explorer.js';

export {
  MthFileExplorer,
  type FileExplorerItem,
  type FileExplorerItemKind,
} from './file-explorer.js';
export { fileExplorerMessages } from './file-explorer.messages.js';
export { fileExplorerSpec } from './file-explorer.spec.js';
export { fileExplorerStyles } from './file-explorer.styles.js';

export function registerMthFileExplorer(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-file-explorer': MthFileExplorer },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-file-explorer': MthFileExplorer;
  }
}
