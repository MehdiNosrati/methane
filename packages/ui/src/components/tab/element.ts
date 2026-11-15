import { defineComponents } from '@methane/core';
import { MthTab } from './tab.js';

export { MthTab } from './tab.js';
export { tabMessages } from './tab.messages.js';
export { tabSpec } from './tab.spec.js';
export { tabStyles } from './tab.styles.js';

export function registerMthTab(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-tab': MthTab },
  });
}
