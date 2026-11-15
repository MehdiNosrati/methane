export const creditCardInputMessages = {
  requiredIndicator: '*',
  defaultLabel: 'Card number',
  invalidCard: 'Please enter a valid card number.',
  brandVisa: 'Visa',
  brandMastercard: 'Mastercard',
  brandAmex: 'American Express',
  brandDiscover: 'Discover',
  brandUnknown: 'Card',
} as const satisfies Record<string, string>;
