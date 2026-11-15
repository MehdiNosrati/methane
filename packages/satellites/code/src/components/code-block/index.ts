import { registerMthCodeBlock } from './element.js';

export * from './element.js';

registerMthCodeBlock();

declare global {
  interface HTMLElementTagNameMap {
    'mth-code-block': import('./code-block.js').MthCodeBlock;
  }
}
