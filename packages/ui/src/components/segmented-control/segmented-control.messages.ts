export const segmentedControlMessages = {
  valueRequired: 'Please select an option.',
  groupLabel: 'Segmented control',
} as const satisfies Record<string, string>;

export type SegmentedControlMessages = typeof segmentedControlMessages;
