export const tourMessages = {
  previousLabel: 'Previous',
  nextLabel: 'Next',
  finishLabel: 'Finish',
  skipLabel: 'Skip tour',
  closeLabel: 'Close tour',
  defaultLabel: 'Product tour',
  stepProgress: 'Step {current} of {total}',
} as const satisfies Record<string, string>;
