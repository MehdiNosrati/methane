import { css } from 'lit';

export const invoiceStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
  }

  .root {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-5, 1.25rem);
    padding: var(--mth-space-6, 1.5rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.35 0.015 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.19 0.01 260)));
  }

  .header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--mth-space-4, 1rem);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: var(--mth-space-3, 0.75rem);
  }

  .logo {
    max-block-size: 2.5rem;
    max-inline-size: 8rem;
    object-fit: contain;
  }

  .title {
    margin: 0;
    font-size: var(--mth-font-size-xl, 1.25rem);
    font-weight: var(--mth-font-weight-bold, 700);
  }

  .meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--mth-space-1, 0.25rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .parties {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: var(--mth-space-4, 1rem);
  }

  .party {
    font-style: normal;
    font-size: var(--mth-font-size-sm, 0.875rem);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .party-label {
    font-size: var(--mth-font-size-xs, 0.75rem);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
  }

  .table {
    inline-size: 100%;
    border-collapse: collapse;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .table th,
  .table td {
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    border-block-end: 1px solid var(--mth-color-border, light-dark(oklch(0.9 0.006 260), oklch(0.32 0.012 260)));
    text-align: start;
  }

  .table th.num,
  .table td.num {
    text-align: end;
    font-variant-numeric: tabular-nums;
  }

  .totals {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
    margin-inline-start: auto;
    min-inline-size: 14rem;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    gap: var(--mth-space-4, 1rem);
    font-variant-numeric: tabular-nums;
  }

  .grand-total {
    padding-block-start: var(--mth-space-2, 0.5rem);
    border-block-start: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.008 260), oklch(0.38 0.015 260)));
    font-weight: var(--mth-font-weight-bold, 700);
    font-size: var(--mth-font-size-md, 1rem);
  }

  .notes {
    margin: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.48 0.015 260), oklch(0.74 0.012 260)));
  }

  @media print {
    .root {
      border: 1px solid currentColor;
      padding: 0.75rem;
    }
  }

  @media (forced-colors: active) {
    .root {
      border: 1px solid CanvasText;
    }

    .table th,
    .table td {
      border-block-end: 1px solid CanvasText;
    }
  }
`;
