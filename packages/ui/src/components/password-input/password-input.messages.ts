export const passwordInputMessages = {
  requiredIndicator: '*',
  defaultLabel: 'Password',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  tooShort: 'Password must be at least {min} characters.',
  strengthLabel: 'Password strength: {level}',
  strengthEmpty: 'None',
  strengthWeak: 'Weak',
  strengthFair: 'Fair',
  strengthGood: 'Good',
  strengthStrong: 'Strong',
} as const satisfies Record<string, string>;
