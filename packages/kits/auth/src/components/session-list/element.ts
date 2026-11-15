import { defineComponents } from '@methane/core';
import { registerMthBadge } from '@methane/ui/badge/element.js';
import { MthSessionList } from './session-list.js';

export { MthSessionList, type SessionListItem } from './session-list.js';
export { sessionListMessages } from './session-list.messages.js';
export { sessionListSpec } from './session-list.spec.js';
export { sessionListStyles } from './session-list.styles.js';

export function registerMthSessionList(prefix?: string): ReadonlyArray<string> {
  registerMthBadge();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-session-list': MthSessionList },
  });
}
