import { defineComponents } from '@methane-ui/core';
import { MthCodeBlock } from './code-block.js';

export { MthCodeBlock, type CodeBlockEngine } from './code-block.js';
export { codeBlockMessages } from './code-block.messages.js';
export { codeBlockSpec } from './code-block.spec.js';
export { codeBlockStyles } from './code-block.styles.js';

export function registerMthCodeBlock(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-code-block': MthCodeBlock },
  });
}
