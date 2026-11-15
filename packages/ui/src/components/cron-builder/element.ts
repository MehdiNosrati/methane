import { defineComponents } from '@methane-ui/core';
import { MthCronBuilder } from './cron-builder.js';

export { MthCronBuilder, type CronPreset } from './cron-builder.js';
export { cronBuilderMessages } from './cron-builder.messages.js';
export { cronBuilderStyles } from './cron-builder.styles.js';

export function registerMthCronBuilder(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-cron-builder': MthCronBuilder },
  });
}
