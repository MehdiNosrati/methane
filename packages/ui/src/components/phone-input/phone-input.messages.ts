export const phoneInputMessages = {
  requiredIndicator: '*',
  defaultLabel: 'Phone number',
  countryCodeLabel: 'Country dial code',
  incompletePhone: 'Please enter a complete phone number.',
} as const satisfies Record<string, string>;
