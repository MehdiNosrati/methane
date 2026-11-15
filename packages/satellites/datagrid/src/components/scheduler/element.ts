import { defineComponents } from '@methane-ui/core';
import { MthScheduler } from './scheduler.js';

export {
  MthScheduler,
  type MthSchedulerEngine,
  type SchedulerEvent,
  type SchedulerResource,
  type TimelineDayColumn,
} from './scheduler.js';
export { schedulerMessages } from './scheduler.messages.js';
export { schedulerStyles } from './scheduler.styles.js';

export function registerMthScheduler(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-scheduler': MthScheduler },
  });
}
