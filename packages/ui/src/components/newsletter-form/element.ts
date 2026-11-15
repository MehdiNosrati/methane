import { defineComponents } from '@methane/core';
import { MthNewsletterForm } from './newsletter-form.js';

export { MthNewsletterForm } from './newsletter-form.js';
export { newsletterFormMessages } from './newsletter-form.messages.js';
export { newsletterFormSpec } from './newsletter-form.spec.js';
export { newsletterFormStyles } from './newsletter-form.styles.js';

export function registerMthNewsletterForm(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-newsletter-form': MthNewsletterForm,
    },
  });
}
