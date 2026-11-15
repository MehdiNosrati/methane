import type { MessageCatalog } from '@methane/core';

export const ganttMessages = {
  gridLabel: 'Project Gantt timeline',
  taskColumnLabel: 'Task',
  emptyLabel: 'No Gantt tasks to display.',
  taskBarLabel: 'Task {title}, {progress}% complete',
  milestoneLabel: 'Milestone {title}',
} as const satisfies MessageCatalog;
