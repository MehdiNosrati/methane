import { defineComponents } from '@methane-ui/core';
import { MthNewsletterForm } from './newsletter-form.js';

export { MthNewsletterForm } from './newsletter-form.js';
export { newsletterFormMessages } from './newsletter-form.messages.js';
export { newsletterFormStyles } from './newsletter-form.styles.js';

export function registerMthNewsletterForm(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-newsletter-form': MthNewsletterForm,
    },
  });
}
