import { css } from '@methane-ui/core';

export const roleMatrixStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
  }

  :host([hidden]),
  [hidden] {
    display: none;
  }

  .container {
    overflow-inline: auto;
    border: 1px solid var(--mth-color-border, light-dark(oklch(86% 0.01 260), oklch(34% 0.01 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
    background-color: var(--mth-color-surface-raised, light-dark(oklch(100% 0 0), oklch(19% 0.01 260)));
  }

  .grid-table {
    inline-size: 100%;
    border-collapse: collapse;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  th,
  td {
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-block-end: 1px solid var(--mth-color-border, light-dark(oklch(86% 0.01 260), oklch(34% 0.01 260)));
    text-align: center;
  }

  tr:last-child th,
  tr:last-child td {
    border-block-end: 0;
  }

  .perm-header,
  .perm-cell {
    text-align: start;
  }

  .role-header,
  .perm-header {
    font-weight: var(--mth-font-weight-semibold, 600);
    color: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
    background-color: var(--mth-color-bg-subtle, light-dark(oklch(96% 0.005 260), oklch(22% 0.01 260)));
  }

  .perm-label {
    display: block;
    font-weight: var(--mth-font-weight-medium, 500);
    color: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
  }

  .perm-category {
    display: block;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(48% 0.01 260), oklch(72% 0.01 260)));
  }

  .cell-check {
    inline-size: 1.125rem;
    block-size: 1.125rem;
    accent-color: var(--mth-color-accent, light-dark(oklch(55% 0.18 255), oklch(70% 0.16 255)));
    cursor: pointer;
  }

  .cell-check:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(55% 0.18 255), oklch(72% 0.16 255)));
    outline-offset: 2px;
  }

  :host([readonly]) .cell-check,
  :host([disabled]) .cell-check {
    cursor: not-allowed;
  }

  :host([disabled]) .cell-check {
    opacity: 0.5;
  }

  .empty {
    margin: 0;
    padding-block: var(--mth-space-4, 1rem);
    padding-inline: var(--mth-space-4, 1rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(48% 0.01 260), oklch(72% 0.01 260)));
    text-align: center;
  }

  @media (forced-colors: active) {
    .container,
    th,
    td {
      border-color: CanvasText;
      background-color: Canvas;
      color: CanvasText;
    }

    .cell-check {
      accent-color: Highlight;
    }

    .cell-check:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
