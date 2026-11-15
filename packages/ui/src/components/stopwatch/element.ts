import { defineComponents } from '@methane-ui/core';
import { MthStopwatch } from './stopwatch.js';

export { MthStopwatch, type StopwatchLap } from './stopwatch.js';
export { stopwatchMessages } from './stopwatch.messages.js';
export { stopwatchStyles } from './stopwatch.styles.js';

export function registerMthStopwatch(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-stopwatch': MthStopwatch },
  });
}
