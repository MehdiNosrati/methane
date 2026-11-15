import { defineComponents } from '@methane/core';
import { registerMthButton } from '@methane/ui/button/element.js';
import { registerMthIcon } from '@methane/ui/icon/element.js';
import { MthAiFeedback } from './ai-feedback.js';

export { MthAiFeedback, type MthAiFeedbackRating } from './ai-feedback.js';
export { aiFeedbackMessages } from './ai-feedback.messages.js';
export { aiFeedbackSpec } from './ai-feedback.spec.js';
export { aiFeedbackStyles } from './ai-feedback.styles.js';

export function registerMthAiFeedback(prefix?: string): ReadonlyArray<string> {
  registerMthButton();
  registerMthIcon();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-ai-feedback': MthAiFeedback },
  });
}
