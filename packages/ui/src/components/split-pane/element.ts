import { defineComponents } from '@methane-ui/core';
import { MthSplitPane } from './split-pane.js';

export { MthSplitPane, type MthSplitPaneOrientation } from './split-pane.js';
export { splitPaneMessages } from './split-pane.messages.js';
export { splitPaneStyles } from './split-pane.styles.js';

export function registerMthSplitPane(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-split-pane': MthSplitPane },
  });
}
