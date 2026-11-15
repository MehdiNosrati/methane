import { css } from 'lit';

export const priceDisplayStyles = css`
  :host {
    display: inline-block;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
  }

  .root {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--mth-space-2);
  }

  .current {
    font-size: var(--mth-font-size-lg);
    font-weight: var(--mth-font-weight-bold);
    line-height: var(--mth-line-height-tight);
    font-variant-numeric: tabular-nums;
  }

  :host(:state(on-sale)) .current {
    color: var(--mth-color-success);
  }

  .period {
    font-size: var(--mth-font-size-xs);
    font-weight: var(--mth-font-weight-normal);
    color: var(--mth-color-fg-muted);
  }

  .compare-at {
    font-size: var(--mth-font-size-sm);
    color: var(--mth-color-fg-subtle);
    text-decoration: line-through;
    font-variant-numeric: tabular-nums;
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (forced-colors: active) {
    :host(:state(on-sale)) .current {
      color: Highlight;
    }
  }
`;
