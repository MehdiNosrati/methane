import { defineComponents } from '@methane-ui/core';
import { MthKanban } from './kanban.js';

export { MthKanban, type KanbanCard, type KanbanLane } from './kanban.js';
export { kanbanMessages } from './kanban.messages.js';
export { kanbanStyles } from './kanban.styles.js';

export function registerMthKanban(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-kanban': MthKanban },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-kanban': MthKanban;
  }
}
