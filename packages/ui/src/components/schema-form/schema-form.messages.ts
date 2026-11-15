export const schemaFormMessages = {
  submitLabel: 'Submit',
  resetLabel: 'Reset',
  requiredField: '{field} is required.',
  minLengthError: '{field} must be at least {min} characters.',
  maxLengthError: '{field} must be at most {max} characters.',
  minimumError: '{field} must be at least {min}.',
  maximumError: '{field} must be at most {max}.',
  invalidEmail: 'Please enter a valid email address.',
  invalidUrl: 'Please enter a valid URL.',
  invalidNumber: 'Please enter a valid number.',
} as const satisfies Record<string, string>;
