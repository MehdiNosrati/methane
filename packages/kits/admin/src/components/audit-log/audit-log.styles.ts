import { css } from 'lit';

export const auditLogStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, oklch(0.2 0.02 260));
    background-color: var(--mth-color-surface, oklch(0.99 0 0));
    border: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    border-radius: var(--mth-radius-md, 0.5rem);
  }

  .base {
    display: flex;
    flex-direction: column;
    inline-size: 100%;
  }

  .filters {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
    padding: var(--mth-space-3, 0.75rem);
    border-block-end: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    background-color: var(--mth-color-surface-raised, oklch(0.96 0.01 260));
  }

  input,
  select {
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg, oklch(0.2 0.02 260));
    background-color: var(--mth-color-surface, oklch(0.99 0 0));
    border: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
  }

  .viewport {
    position: relative;
    block-size: 20rem;
    overflow-block: auto;
  }

  .virtual-list {
    position: relative;
    inline-size: 100%;
  }

  .row {
    position: absolute;
    inset-inline: 0;
    inset-block-start: 0;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-block-end: 1px solid var(--mth-color-border, oklch(0.9 0.01 260));
    box-sizing: border-box;
    cursor: pointer;
    background-color: var(--mth-color-surface, oklch(0.99 0 0));
  }

  .row:focus-visible,
  input:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.2 250));
    outline-offset: -2px;
  }

  .severity {
    font-size: var(--mth-font-size-xs, 0.75rem);
    padding-block: 0.125rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border-radius: var(--mth-radius-sm, 0.25rem);
    border: 1px solid var(--mth-color-border, oklch(0.85 0.01 260));
  }

  .severity[data-severity='warning'] {
    color: var(--mth-color-warning, oklch(0.65 0.16 80));
    border-color: var(--mth-color-warning, oklch(0.65 0.16 80));
  }

  .severity[data-severity='critical'] {
    color: var(--mth-color-danger, oklch(0.55 0.22 25));
    border-color: var(--mth-color-danger, oklch(0.55 0.22 25));
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-inline-size: 0;
  }

  .summary {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .resource,
  .timestamp,
  .status {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, oklch(0.45 0.02 260));
  }

  .status {
    padding: var(--mth-space-4, 1rem);
    text-align: center;
  }

  .status[hidden] {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    :host {
      border-color: CanvasText;
      background-color: Canvas;
      color: CanvasText;
    }
  }
`;
