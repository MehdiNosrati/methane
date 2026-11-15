import { defineComponents } from '@methane/core';
import { MthCommentThread } from './comment-thread.js';

export { MthCommentThread, type CommentItem } from './comment-thread.js';
export {
  commentThreadMessages,
  type CommentThreadMessages,
} from './comment-thread.messages.js';
export { commentThreadSpec } from './comment-thread.spec.js';
export { commentThreadStyles } from './comment-thread.styles.js';

export function registerMthCommentThread(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-comment-thread': MthCommentThread },
  });
}
