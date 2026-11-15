import { registerMthMessageComposer } from './element.js';

export * from './element.js';

registerMthMessageComposer();

declare global {
  interface HTMLElementTagNameMap {
    'mth-message-composer': import('./message-composer.js').MthMessageComposer;
  }
}
