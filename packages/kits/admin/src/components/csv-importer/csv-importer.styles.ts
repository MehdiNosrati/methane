import { css } from 'lit';

export const csvImporterStyles = css`
  :host {
    display: block;
    color: var(--mth-color-fg, light-dark(oklch(0.18 0.02 260), oklch(0.94 0.01 260)));
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
    padding: var(--mth-space-4, 1rem);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.16 0.015 260)));
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
  }

  .dropzone {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    padding: var(--mth-space-3, 0.75rem);
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.97 0.005 260), oklch(0.2 0.015 260)));
    border: 1px dashed var(--mth-color-border, light-dark(oklch(0.8 0.01 260), oklch(0.36 0.02 260)));
    border-radius: var(--mth-radius-md, 0.5rem);
  }

  .field-label {
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .csv-input,
  .map-select {
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: inherit;
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.14 0.015 260)));
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.82 0.01 260), oklch(0.34 0.02 260)));
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: 0.375rem;
    padding-inline: var(--mth-space-2, 0.5rem);
  }

  .mapping-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: var(--mth-space-2, 0.5rem);
  }

  .map-card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .table-wrap {
    overflow-inline: auto;
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.01 260), oklch(0.32 0.02 260)));
    border-radius: var(--mth-radius-md, 0.5rem);
  }

  table {
    inline-size: 100%;
    border-collapse: collapse;
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  th,
  td {
    padding-block: 0.375rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border-block-end: 1px solid
      var(--mth-color-border, light-dark(oklch(0.88 0.01 260), oklch(0.28 0.02 260)));
    text-align: start;
  }

  th {
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.97 0.005 260), oklch(0.2 0.015 260)));
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  tr[data-invalid='true'] {
    color: var(--mth-color-danger, light-dark(oklch(0.52 0.2 25), oklch(0.75 0.18 25)));
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .btn-group {
    display: inline-flex;
    gap: var(--mth-space-2, 0.5rem);
  }

  .btn {
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.82 0.01 260), oklch(0.34 0.02 260)));
    background: transparent;
    color: inherit;
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: 0.375rem;
    padding-inline: var(--mth-space-3, 0.75rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
    cursor: pointer;
  }

  .btn-primary {
    border-color: var(--mth-color-accent, light-dark(oklch(0.55 0.2 255), oklch(0.68 0.18 255)));
    background: var(--mth-color-accent, light-dark(oklch(0.55 0.2 255), oklch(0.68 0.18 255)));
    color: var(--mth-color-accent-fg, light-dark(oklch(0.99 0 0), oklch(0.14 0.02 255)));
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .hint {
    margin: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.02 260), oklch(0.72 0.02 260)));
  }

  [hidden] {
    display: none;
  }

  .csv-input:focus-visible,
  .map-select:focus-visible,
  .btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.58 0.18 255), oklch(0.74 0.16 255)));
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .btn {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .base,
    .dropzone,
    .table-wrap,
    .btn,
    .csv-input,
    .map-select {
      forced-color-adjust: none;
      border-color: CanvasText;
      color: CanvasText;
      background: Canvas;
    }

    .btn-primary {
      background: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }
  }
`;
