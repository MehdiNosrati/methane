import { registerMthCollabCursors } from './element.js';

export * from './element.js';

registerMthCollabCursors();

declare global {
  interface HTMLElementTagNameMap {
    'mth-collab-cursors': import('./collab-cursors.js').MthCollabCursors;
  }
}
