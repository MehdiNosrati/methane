import { defineComponents } from '@methane/core';
import { MthBackToTop } from './back-to-top.js';

export { MthBackToTop } from './back-to-top.js';
export { backToTopMessages } from './back-to-top.messages.js';
export { backToTopSpec } from './back-to-top.spec.js';
export { backToTopStyles } from './back-to-top.styles.js';

export function registerMthBackToTop(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-back-to-top': MthBackToTop },
  });
}
