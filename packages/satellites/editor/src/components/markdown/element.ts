import { defineComponents } from '@methane/core';
import { MthMarkdown } from './markdown.js';

export { MthMarkdown, type MarkdownRendererEngine } from './markdown.js';
export { markdownMessages } from './markdown.messages.js';
export { markdownSpec } from './markdown.spec.js';
export { markdownStyles } from './markdown.styles.js';

export function registerMthMarkdown(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-markdown': MthMarkdown },
  });
}
