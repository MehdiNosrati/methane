import { registerMthNewsletterForm } from './element.js';
import type { MthNewsletterForm } from './newsletter-form.js';

registerMthNewsletterForm();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-newsletter-form': MthNewsletterForm;
  }
}
