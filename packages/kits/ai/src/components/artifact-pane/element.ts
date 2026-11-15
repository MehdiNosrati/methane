import { defineComponents } from '@methane-ui/core';
import { registerMthBadge } from '@methane-ui/ui/badge/element.js';
import { registerMthButton } from '@methane-ui/ui/button/element.js';
import { registerMthIcon } from '@methane-ui/ui/icon/element.js';
import { MthArtifactPane } from './artifact-pane.js';

export {
  MthArtifactPane,
  type ArtifactVersion,
  type MthArtifactKind,
  type MthArtifactTab,
} from './artifact-pane.js';
export { artifactPaneMessages } from './artifact-pane.messages.js';
export { artifactPaneStyles } from './artifact-pane.styles.js';

export function registerMthArtifactPane(prefix?: string): ReadonlyArray<string> {
  registerMthBadge();
  registerMthButton();
  registerMthIcon();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-artifact-pane': MthArtifactPane },
  });
}
