import { defineComponents } from '@methane-ui/core';
import { MthSuggestionChips } from './suggestion-chips.js';

export {
  MthSuggestionChips,
  type MthSuggestionOrientation,
  type SuggestionChipItem,
} from './suggestion-chips.js';
export { suggestionChipsMessages } from './suggestion-chips.messages.js';
export { suggestionChipsSpec } from './suggestion-chips.spec.js';
export { suggestionChipsStyles } from './suggestion-chips.styles.js';

export function registerMthSuggestionChips(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-suggestion-chips': MthSuggestionChips },
  });
}
