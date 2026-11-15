export const otpInputMessages = {
  requiredIndicator: '*',
  defaultLabel: 'Verification code',
  cellLabel: 'Digit {index} of {total}',
  incompleteCode: 'Please enter all {length} characters.',
} as const satisfies Record<string, string>;
