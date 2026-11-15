import { css } from 'lit';

export const carouselItemStyles = css`
  :host {
    display: block;
    flex: 0 0 calc(100% / var(--_mth-carousel-slides-per-view, 1));
    inline-size: calc(100% / var(--_mth-carousel-slides-per-view, 1));
    scroll-snap-align: start;
    box-sizing: border-box;
  }

  .base {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  @media (forced-colors: active) {
    :host([active]) {
      outline: 1px solid Highlight;
    }
  }
`;
