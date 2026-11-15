import { registerMthSessionList } from './element.js';

export * from './element.js';

registerMthSessionList();

declare global {
  interface HTMLElementTagNameMap {
    'mth-session-list': import('./session-list.js').MthSessionList;
  }
}
