import { defineComponents } from '@methane-ui/core';
import { MthToc } from './toc.js';

export { MthToc, type TocItem } from './toc.js';
export { tocMessages } from './toc.messages.js';
export { tocStyles } from './toc.styles.js';

export function registerMthToc(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-toc': MthToc },
  });
}
