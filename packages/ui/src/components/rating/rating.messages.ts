export const ratingMessages = {
  valueRequired: 'Please provide a rating.',
  starAriaPattern: '{index} of {max} stars',
  clearLabel: 'Clear rating',
  defaultLabel: 'Rating',
} as const satisfies Record<string, string>;

export type RatingMessages = typeof ratingMessages;
