import { defineComponents } from '@methane-ui/core';
import { MthBulkActionBar } from './bulk-action-bar.js';

export { MthBulkActionBar, type BulkActionItem } from './bulk-action-bar.js';
export { bulkActionBarMessages } from './bulk-action-bar.messages.js';
export { bulkActionBarSpec } from './bulk-action-bar.spec.js';
export { bulkActionBarStyles } from './bulk-action-bar.styles.js';

export function registerMthBulkActionBar(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-bulk-action-bar': MthBulkActionBar },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-bulk-action-bar': MthBulkActionBar;
  }
}
