import { registerMthAiFeedback } from './element.js';

export * from './element.js';

registerMthAiFeedback();

declare global {
  interface HTMLElementTagNameMap {
    'mth-ai-feedback': import('./ai-feedback.js').MthAiFeedback;
  }
}
