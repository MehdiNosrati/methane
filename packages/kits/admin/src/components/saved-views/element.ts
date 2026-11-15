import { defineComponents } from '@methane/core';
import { MthSavedViews } from './saved-views.js';

export { MthSavedViews, type SavedViewItem } from './saved-views.js';
export { savedViewsMessages } from './saved-views.messages.js';
export { savedViewsSpec } from './saved-views.spec.js';
export { savedViewsStyles } from './saved-views.styles.js';

export function registerMthSavedViews(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-saved-views': MthSavedViews },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-saved-views': MthSavedViews;
  }
}
