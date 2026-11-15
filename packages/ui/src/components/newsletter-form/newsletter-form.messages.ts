export const newsletterFormMessages = {
  heading: 'Subscribe to updates',
  description: 'Get product news and release notes in your inbox.',
  emailLabel: 'Email address',
  emailPlaceholder: 'you@example.com',
  submitLabel: 'Subscribe',
  submittingLabel: 'Subscribing...',
  successMessage: 'Thanks for subscribing!',
  invalidEmail: 'Please enter a valid email address.',
  requiredEmail: 'Email address is required.',
} as const satisfies Record<string, string>;
