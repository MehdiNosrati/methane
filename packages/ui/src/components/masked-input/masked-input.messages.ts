export const maskedInputMessages = {
  requiredIndicator: '*',
  defaultLabel: 'Formatted input',
  incompleteMask: 'Please complete the required format ({mask}).',
} as const satisfies Record<string, string>;
