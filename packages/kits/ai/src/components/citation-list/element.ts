import { defineComponents } from '@methane-ui/core';
import { registerMthBadge } from '@methane-ui/ui/badge/element.js';
import { registerMthIcon } from '@methane-ui/ui/icon/element.js';
import { MthCitationList } from './citation-list.js';

export {
  MthCitationList,
  isSafeHttpUrl,
  type CitationItem,
  type MthCitationOrientation,
} from './citation-list.js';
export { citationListMessages } from './citation-list.messages.js';
export { citationListStyles } from './citation-list.styles.js';

export function registerMthCitationList(prefix?: string): ReadonlyArray<string> {
  registerMthBadge();
  registerMthIcon();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-citation-list': MthCitationList },
  });
}
