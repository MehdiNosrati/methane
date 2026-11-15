export const sliderMessages = {
  valueRequired: 'Please select a value.',
  decreaseValue: 'Decrease value',
  increaseValue: 'Increase value',
  defaultLabel: 'Slider',
} as const satisfies Record<string, string>;

export type SliderMessages = typeof sliderMessages;
