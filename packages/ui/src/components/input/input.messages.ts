export const inputMessages = {
  valueMissing: 'Please fill out this field.',
  typeMismatchEmail: 'Please enter a valid email address.',
  typeMismatchUrl: 'Please enter a valid URL.',
  tooShort: 'Value is too short.',
  patternMismatch: 'Please match the requested format.',
  requiredIndicator: '*',
} as const satisfies Record<string, string>;
