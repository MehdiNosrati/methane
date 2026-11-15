import { registerMthSuggestionChips } from './element.js';

export * from './element.js';

registerMthSuggestionChips();

declare global {
  interface HTMLElementTagNameMap {
    'mth-suggestion-chips': import('./suggestion-chips.js').MthSuggestionChips;
  }
}
