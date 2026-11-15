export const formWizardMessages = {
  defaultLabel: 'Multi-step form',
  stepIndicator: 'Step {current} of {total}',
  stepTabLabel: 'Step {index}: {title}',
  backLabel: 'Back',
  nextLabel: 'Next',
  submitLabel: 'Finish',
  stepDefaultTitle: 'Step {index}',
  stepInvalid: 'Please complete all required fields in this step before continuing.',
} as const satisfies Record<string, string>;
