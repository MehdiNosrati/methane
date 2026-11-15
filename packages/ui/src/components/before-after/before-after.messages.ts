export const beforeAfterMessages = {
  comparisonLabel: 'Before and after comparison',
  dividerLabel: 'Comparison slider',
  beforeLabel: 'Before',
  afterLabel: 'After',
} as const satisfies Record<string, string>;

export type BeforeAfterMessages = typeof beforeAfterMessages;
