import { registerMthEmptyState } from './element.js';

export * from './element.js';

registerMthEmptyState();

declare global {
  interface HTMLElementTagNameMap {
    'mth-empty-state': import('./empty-state.js').MthEmptyState;
  }
}
