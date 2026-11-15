import { css } from 'lit';

export const transferListStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.2 0.02 250), oklch(0.92 0.01 250)));
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: 500;
  }

  .panes {
    display: grid;
    grid-template-columns: minmax(var(--mth-transfer-pane-inline-size, 12rem), 1fr) auto minmax(
        var(--mth-transfer-pane-inline-size, 12rem),
        1fr
      );
    gap: var(--mth-space-3, 0.75rem);
    align-items: stretch;
  }

  .pane {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.82 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.18 0.01 250)));
    overflow: hidden;
  }

  :host([data-user-invalid]) .pane {
    border-color: var(--mth-color-danger, light-dark(oklch(0.55 0.22 25), oklch(0.68 0.18 25)));
  }

  :host([data-disabled]) .panes,
  :host([disabled]) .panes {
    opacity: 0.55;
  }

  .pane-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-block-end: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.01 250), oklch(0.3 0.01 250)));
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.97 0.01 250), oklch(0.22 0.01 250)));
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: 500;
  }

  .pane-title-wrap {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    cursor: pointer;
  }

  .pane-count {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.52 0.01 250), oklch(0.68 0.01 250)));
  }

  .search-wrap {
    padding: var(--mth-space-2, 0.5rem);
    border-block-end: 1px solid var(--mth-color-border, light-dark(oklch(0.9 0.01 250), oklch(0.28 0.01 250)));
  }

  .search {
    inline-size: 100%;
    box-sizing: border-box;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.82 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: inherit;
    color: inherit;
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .list {
    list-style: none;
    margin: 0;
    padding: var(--mth-space-1, 0.25rem);
    block-size: var(--mth-transfer-list-block-size, 14rem);
    overflow-block: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.375rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border-radius: var(--mth-radius-sm, 0.375rem);
    cursor: pointer;
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .item:hover:not([data-disabled='true']) {
    background: var(--mth-color-bg-subtle, light-dark(oklch(0.95 0.01 250), oklch(0.26 0.02 250)));
  }

  .item[data-disabled='true'] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .empty {
    padding: var(--mth-space-4, 1rem);
    text-align: center;
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.52 0.01 250), oklch(0.68 0.01 250)));
  }

  .actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2.25rem;
    min-block-size: 2rem;
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.8 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.2 0.01 250)));
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .action-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .action-button:focus-visible,
  .search:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.2 255), oklch(0.72 0.18 255)));
    outline-offset: 2px;
  }

  .hint {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.52 0.01 250), oklch(0.68 0.01 250)));
  }

  .error {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-danger, light-dark(oklch(0.55 0.22 25), oklch(0.68 0.18 25)));
  }

  @media (forced-colors: active) {
    .pane,
    .search,
    .action-button {
      border-color: ButtonText;
    }
  }
`;
