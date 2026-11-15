import { defineComponents } from '@methane-ui/core';
import { MthCommentThread } from './comment-thread.js';

export { MthCommentThread, type CommentItem } from './comment-thread.js';
export {
  commentThreadMessages,
  type CommentThreadMessages,
} from './comment-thread.messages.js';
export { commentThreadStyles } from './comment-thread.styles.js';

export function registerMthCommentThread(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-comment-thread': MthCommentThread },
  });
}
