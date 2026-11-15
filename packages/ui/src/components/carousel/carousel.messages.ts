export const carouselMessages = {
  carouselLabel: 'Carousel',
  previousSlide: 'Previous slide',
  nextSlide: 'Next slide',
  slidePaginationLabel: 'Slide pagination',
  goToSlide: 'Go to slide',
} as const satisfies Record<string, string>;

export type CarouselMessages = typeof carouselMessages;
