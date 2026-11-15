import { registerMthMarkdown } from './element.js';

export * from './element.js';

registerMthMarkdown();

declare global {
  interface HTMLElementTagNameMap {
    'mth-markdown': import('./markdown.js').MthMarkdown;
  }
}
