import { defineComponents } from '@methane/core';
import { MthToc } from './toc.js';

export { MthToc, type TocItem } from './toc.js';
export { tocMessages } from './toc.messages.js';
export { tocSpec } from './toc.spec.js';
export { tocStyles } from './toc.styles.js';

export function registerMthToc(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-toc': MthToc },
  });
}
