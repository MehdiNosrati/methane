export const ibanInputMessages = {
  requiredIndicator: '*',
  defaultLabel: 'IBAN',
  invalidIban: 'Please enter a valid IBAN.',
} as const satisfies Record<string, string>;
