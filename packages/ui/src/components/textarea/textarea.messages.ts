export const textareaMessages = {
  valueMissing: 'Please fill out this field.',
  tooShort: 'Please enter at least {min} characters.',
  tooLong: 'Please enter no more than {max} characters.',
  requiredIndicator: '*',
  characterCount: '{count} characters',
  characterCountLimit: '{count} / {max}',
} as const satisfies Record<string, string>;
