import { css } from 'lit';

export const galleryStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.2 0.02 250), oklch(0.92 0.01 250)));
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
  }

  .slide-button {
    display: block;
    inline-size: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    cursor: zoom-in;
    text-align: start;
  }

  .slide-image {
    display: block;
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: var(--mth-radius-md, 0.5rem);
  }

  .caption {
    padding-block-start: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.01 250), oklch(0.72 0.01 250)));
  }

  .thumbnails {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
    justify-content: center;
  }

  .thumbnail {
    inline-size: var(--mth-gallery-thumbnail-size, 4rem);
    block-size: var(--mth-gallery-thumbnail-size, 4rem);
    padding: 2px;
    border: 2px solid transparent;
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 250), oklch(0.2 0.01 250)));
    overflow: hidden;
    cursor: pointer;
  }

  .thumbnail[aria-pressed='true'] {
    border-color: var(--mth-color-accent, light-dark(oklch(0.55 0.2 255), oklch(0.7 0.18 255)));
  }

  .thumbnail img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    border-radius: var(--mth-radius-xs, 0.25rem);
  }

  .slide-button:focus-visible,
  .thumbnail:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.2 255), oklch(0.72 0.18 255)));
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .thumbnail[aria-pressed='true'] {
      border-color: Highlight;
    }
  }
`;
