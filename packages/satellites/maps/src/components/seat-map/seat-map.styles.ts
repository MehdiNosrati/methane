import { css } from '@methane-ui/core';

export const seatMapStyles = css`
  :host {
    display: block;
    inline-size: 100%;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3);
    background: var(--mth-color-surface);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md);
    padding-block: var(--mth-space-3);
    padding-inline: var(--mth-space-3);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2);
  }

  .label {
    font-size: var(--mth-font-size-sm);
    font-weight: var(--mth-font-weight-medium);
  }

  .summary {
    font-size: var(--mth-font-size-xs);
    color: var(--mth-color-fg-muted);
  }

  .stage {
    text-align: center;
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-3);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm);
    background: var(--mth-color-bg-subtle);
    font-size: var(--mth-font-size-xs);
    color: var(--mth-color-fg-muted);
  }

  .grid {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2);
  }

  .row {
    display: flex;
    flex-wrap: nowrap;
    gap: var(--mth-space-2);
    justify-content: center;
  }

  .seat-btn {
    min-inline-size: 2.25rem;
    block-size: 2.25rem;
    padding-inline: var(--mth-space-2);
    border: 1px solid var(--mth-color-border-strong);
    border-radius: var(--mth-radius-sm);
    background: var(--mth-color-surface-raised);
    color: var(--mth-color-fg);
    font-size: var(--mth-font-size-xs);
    font-weight: var(--mth-font-weight-semibold);
    cursor: pointer;
  }

  .seat-btn[data-tier='vip'] {
    border-color: var(--mth-color-warning);
  }

  .seat-btn[aria-selected='true'] {
    background: var(--mth-color-accent);
    color: var(--mth-color-accent-fg);
    border-color: var(--mth-color-accent);
  }

  .seat-btn[aria-disabled='true'] {
    background: var(--mth-color-bg-subtle);
    color: var(--mth-color-fg-subtle);
    border-style: dashed;
    cursor: not-allowed;
  }

  .seat-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-3);
    font-size: var(--mth-font-size-xs);
    color: var(--mth-color-fg-muted);
  }

  .error {
    font-size: var(--mth-font-size-xs);
    color: var(--mth-color-danger);
  }

  @media (forced-colors: active) {
    .seat-btn[aria-selected='true'] {
      forced-color-adjust: none;
    }
  }
`;
