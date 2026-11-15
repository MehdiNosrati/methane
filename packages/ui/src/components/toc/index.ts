import { registerMthToc } from './element.js';

export * from './element.js';

registerMthToc();

declare global {
  interface HTMLElementTagNameMap {
    'mth-toc': import('./toc.js').MthToc;
  }
}
