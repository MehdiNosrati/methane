export const carouselItemMessages = {
  slideLabel: 'Slide',
} as const satisfies Record<string, string>;

export type CarouselItemMessages = typeof carouselItemMessages;
