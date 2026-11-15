import { registerMthCronBuilder } from './element.js';

export * from './element.js';

registerMthCronBuilder();

declare global {
  interface HTMLElementTagNameMap {
    'mth-cron-builder': import('./cron-builder.js').MthCronBuilder;
  }
}
