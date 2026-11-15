import { registerMthReactionBar } from './element.js';

export * from './element.js';

registerMthReactionBar();

declare global {
  interface HTMLElementTagNameMap {
    'mth-reaction-bar': import('./reaction-bar.js').MthReactionBar;
  }
}
