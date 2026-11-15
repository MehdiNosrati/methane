import { defineComponents } from '@methane-ui/core';
import { registerMthButton } from '@methane-ui/ui/button/element.js';
import { registerMthIcon } from '@methane-ui/ui/icon/element.js';
import { MthAiFeedback } from './ai-feedback.js';

export { MthAiFeedback, type MthAiFeedbackRating } from './ai-feedback.js';
export { aiFeedbackMessages } from './ai-feedback.messages.js';
export { aiFeedbackStyles } from './ai-feedback.styles.js';

export function registerMthAiFeedback(prefix?: string): ReadonlyArray<string> {
  registerMthButton();
  registerMthIcon();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-ai-feedback': MthAiFeedback },
  });
}
