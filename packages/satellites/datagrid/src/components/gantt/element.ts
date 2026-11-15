import { defineComponents } from '@methane/core';
import { MthGantt } from './gantt.js';

export { MthGantt, type GanttBarLayout, type GanttTask, type MthGanttEngine } from './gantt.js';
export { ganttMessages } from './gantt.messages.js';
export { ganttSpec } from './gantt.spec.js';
export { ganttStyles } from './gantt.styles.js';

export function registerMthGantt(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-gantt': MthGantt },
  });
}
