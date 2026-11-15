import { css } from 'lit';

export const imageStyles = css`
  :host {
    display: block;
    position: relative;
    overflow: hidden;
    border-radius: var(--mth-image-radius, var(--mth-radius-none, 0));
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 250), oklch(0.2 0.01 250)));
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.01 250), oklch(0.72 0.01 250)));
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  :host([rounded]) {
    border-radius: var(--mth-image-radius, var(--mth-radius-md, 0.5rem));
  }

  .base {
    position: relative;
    display: grid;
    place-items: center;
    inline-size: 100%;
    block-size: 100%;
    aspect-ratio: var(--_aspect-ratio, auto);
  }

  .img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: var(--_fit, cover);
  }

  .img[hidden],
  .placeholder[hidden],
  .fallback[hidden] {
    display: none;
  }

  .placeholder,
  .fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--mth-space-3, 0.75rem);
    text-align: center;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  @media (forced-colors: active) {
    :host {
      border: 1px solid CanvasText;
    }
  }
`;
