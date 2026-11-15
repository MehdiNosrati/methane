import { registerMthTooltip } from './element.js';

export * from './element.js';

registerMthTooltip();

declare global {
  interface HTMLElementTagNameMap {
    'mth-tooltip': import('./tooltip.js').MthTooltip;
  }
}
