import { defineComponents } from '@methane-ui/core';
import { MthCodeTabs } from './code-tabs.js';

export { MthCodeTabs, type CodeTabItem } from './code-tabs.js';
export { codeTabsMessages, type CodeTabsMessages } from './code-tabs.messages.js';
export { codeTabsStyles } from './code-tabs.styles.js';

export function registerMthCodeTabs(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-code-tabs': MthCodeTabs },
  });
}
