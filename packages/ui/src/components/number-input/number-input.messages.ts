export const numberInputMessages = {
  requiredIndicator: '*',
  defaultLabel: 'Number',
  increment: 'Increase value',
  decrement: 'Decrease value',
  invalidNumber: 'Please enter a valid number.',
  rangeUnderflow: 'Value must be greater than or equal to {min}.',
  rangeOverflow: 'Value must be less than or equal to {max}.',
} as const satisfies Record<string, string>;
