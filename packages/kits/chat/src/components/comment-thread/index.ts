import { registerMthCommentThread } from './element.js';

export * from './element.js';

registerMthCommentThread();

declare global {
  interface HTMLElementTagNameMap {
    'mth-comment-thread': import('./comment-thread.js').MthCommentThread;
  }
}
