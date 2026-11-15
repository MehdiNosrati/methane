import { defineComponents } from '@methane/core';
import { MthCronBuilder } from './cron-builder.js';

export { MthCronBuilder, type CronPreset } from './cron-builder.js';
export { cronBuilderMessages } from './cron-builder.messages.js';
export { CEM_METADATA, cronBuilderSpec } from './cron-builder.spec.js';
export { cronBuilderStyles } from './cron-builder.styles.js';

export function registerMthCronBuilder(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-cron-builder': MthCronBuilder },
  });
}
