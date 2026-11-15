export const rangeSliderMessages = {
  startThumbLabel: 'Minimum value',
  endThumbLabel: 'Maximum value',
  valueRequired: 'Please select a range.',
} as const satisfies Record<string, string>;

export type RangeSliderMessages = typeof rangeSliderMessages;
