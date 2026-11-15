import { registerMthToolCall } from './element.js';

export * from './element.js';

registerMthToolCall();

declare global {
  interface HTMLElementTagNameMap {
    'mth-tool-call': import('./tool-call.js').MthToolCall;
  }
}
