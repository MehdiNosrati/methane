import { css } from 'lit';

export const productCardStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
  }

  .card {
    display: flex;
    flex-direction: column;
    block-size: 100%;
    border-width: 1px;
    border-style: solid;
    border-color: var(--mth-color-border);
    border-radius: var(--mth-radius-lg);
    background-color: var(--mth-color-surface);
    overflow: hidden;
    transition-property: box-shadow, border-color;
    transition-duration: var(--mth-motion-duration-fast);
    transition-timing-function: var(--mth-motion-easing-standard);
  }

  .card:hover {
    border-color: var(--mth-color-border-strong);
    box-shadow: var(--mth-shadow-sm);
  }

  .media {
    position: relative;
    aspect-ratio: 4 / 3;
    background-color: var(--mth-color-bg-subtle);
    overflow: hidden;
  }

  .image {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    inline-size: 100%;
    block-size: 100%;
    font-size: var(--mth-font-size-xs);
    color: var(--mth-color-fg-subtle);
  }

  .badge-slot {
    position: absolute;
    inset-block-start: var(--mth-space-3);
    inset-inline-start: var(--mth-space-3);
  }

  .body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: var(--mth-space-2);
    padding-block: var(--mth-space-4);
    padding-inline: var(--mth-space-4);
  }

  .title {
    margin-block: 0;
    margin-inline: 0;
    font-size: var(--mth-font-size-md);
    font-weight: var(--mth-font-weight-semibold);
    line-height: var(--mth-line-height-tight);
  }

  .title-link {
    color: inherit;
    text-decoration: none;
  }

  .title-link:hover {
    text-decoration: underline;
  }

  .title-link:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
    border-radius: var(--mth-radius-xs);
  }

  .subtitle {
    margin-block: 0;
    margin-inline: 0;
    font-size: var(--mth-font-size-sm);
    color: var(--mth-color-fg-muted);
  }

  .rating {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1);
    font-size: var(--mth-font-size-xs);
    color: var(--mth-color-fg-muted);
  }

  .stars {
    color: var(--mth-color-warning);
    letter-spacing: 0.05em;
  }

  .price-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--mth-space-2);
    margin-block-start: auto;
    padding-block-start: var(--mth-space-1);
  }

  .current-price {
    font-size: var(--mth-font-size-lg);
    font-weight: var(--mth-font-weight-bold);
    font-variant-numeric: tabular-nums;
  }

  .compare-price {
    font-size: var(--mth-font-size-sm);
    color: var(--mth-color-fg-subtle);
    text-decoration: line-through;
    font-variant-numeric: tabular-nums;
  }

  .footer {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2);
    padding-block-end: var(--mth-space-4);
    padding-inline: var(--mth-space-4);
  }

  @media (forced-colors: active) {
    .card {
      border-color: ButtonText;
    }

    .stars {
      color: Highlight;
    }
  }
`;
