import { css } from 'lit';

export const ratingStyles = css`
  :host {
    display: inline-block;
    font-family: inherit;
    color: var(--mth-color-fg, light-dark(oklch(0.208 0.042 266), oklch(0.984 0.003 248)));
    --_star-size: 1.5rem;
  }

  :host([size='sm']) {
    --_star-size: 1.125rem;
  }

  :host([size='lg']) {
    --_star-size: 2rem;
  }

  :host([disabled]) {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .base {
    display: inline-flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: 500;
  }

  .group {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
  }

  .star {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--mth-space-1, 0.25rem);
    border: none;
    border-radius: 0.25rem;
    background: transparent;
    color: var(--mth-rating-color-empty, var(--mth-color-border-strong, light-dark(oklch(0.869 0.022 253), oklch(0.446 0.043 257))));
    cursor: pointer;
    line-height: 1;
    transition: transform var(--mth-motion-duration-fast, 120ms) ease,
      color var(--mth-motion-duration-fast, 120ms) ease;
  }

  .star[data-state='full'] {
    color: var(--mth-rating-color-filled, oklch(0.75 0.17 75));
  }

  .star[data-state='half'] {
    color: var(--mth-rating-color-empty, var(--mth-color-border-strong, light-dark(oklch(0.869 0.022 253), oklch(0.446 0.043 257))));
  }

  .star-icon {
    inline-size: var(--_star-size);
    block-size: var(--_star-size);
    display: block;
    fill: currentColor;
  }

  .star-half-overlay {
    position: absolute;
    inset-block-start: var(--mth-space-1, 0.25rem);
    inset-inline-start: var(--mth-space-1, 0.25rem);
    inline-size: calc(var(--_star-size) / 2);
    block-size: var(--_star-size);
    overflow: hidden;
    color: var(--mth-rating-color-filled, oklch(0.75 0.17 75));
    pointer-events: none;
  }

  .star:hover:not(:disabled) {
    transform: scale(1.08);
  }

  .star:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 255));
    outline-offset: 2px;
  }

  :host([readonly]) .star,
  :host([disabled]) .star {
    cursor: default;
  }

  :host([readonly]) .star:hover,
  :host([disabled]) .star:hover {
    transform: none;
  }

  .hint {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.446 0.043 257), oklch(0.704 0.04 257)));
  }

  .error {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-danger, oklch(0.58 0.22 27));
  }

  @media (forced-colors: active) {
    .star {
      color: GrayText;
    }

    .star[data-state='full'],
    .star-half-overlay {
      color: Highlight;
    }

    .star:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
