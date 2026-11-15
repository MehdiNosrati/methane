import { defineComponents } from '@methane-ui/core';
import { MthCurrencyInput } from './currency-input.js';

export { MthCurrencyInput } from './currency-input.js';
export { currencyInputMessages } from './currency-input.messages.js';
export { currencyInputStyles } from './currency-input.styles.js';

export function registerMthCurrencyInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-currency-input': MthCurrencyInput },
  });
}
