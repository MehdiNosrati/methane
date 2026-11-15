export const segmentedControlMessages = {
  valueRequired: 'Please select an option.',
} as const satisfies Record<string, string>;

export type SegmentedControlMessages = typeof segmentedControlMessages;
