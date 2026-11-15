import { defineComponents } from '@methane-ui/core';
import { MthCollabCursors } from './collab-cursors.js';

export {
  MthCollabCursors,
  type CollabCursor,
  type CollabCursorSelection,
} from './collab-cursors.js';
export { collabCursorsMessages, type CollabCursorsMessages } from './collab-cursors.messages.js';
export { collabCursorsSpec } from './collab-cursors.spec.js';
export { collabCursorsStyles } from './collab-cursors.styles.js';

export function registerMthCollabCursors(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-collab-cursors': MthCollabCursors },
  });
}
