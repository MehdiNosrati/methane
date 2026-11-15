export const currencyInputMessages = {
  requiredIndicator: '*',
  defaultLabel: 'Amount',
  invalidAmount: 'Please enter a valid monetary amount.',
  rangeUnderflow: 'Amount must be at least {min}.',
  rangeOverflow: 'Amount must not exceed {max}.',
} as const satisfies Record<string, string>;
