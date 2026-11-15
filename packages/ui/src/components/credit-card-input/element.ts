import { defineComponents } from '@methane/core';
import { MthCreditCardInput } from './credit-card-input.js';

export { MthCreditCardInput, detectCardBrand, type CardBrand } from './credit-card-input.js';
export { creditCardInputMessages } from './credit-card-input.messages.js';
export { creditCardInputSpec, CEM_METADATA } from './credit-card-input.spec.js';
export { creditCardInputStyles } from './credit-card-input.styles.js';

export function registerMthCreditCardInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-credit-card-input': MthCreditCardInput },
  });
}
