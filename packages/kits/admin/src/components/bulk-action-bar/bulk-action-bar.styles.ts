import { css } from 'lit';

export const bulkActionBarStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, oklch(0.2 0.02 260));
  }

  .base {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-4, 1rem);
    background-color: var(--mth-color-surface-raised, oklch(0.96 0.01 260));
    border: 1px solid var(--mth-color-accent, oklch(0.6 0.2 250));
    border-radius: var(--mth-radius-md, 0.5rem);
  }

  .base[hidden] {
    display: none;
  }

  .summary,
  .actions {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    flex-wrap: wrap;
  }

  .count {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  button {
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg, oklch(0.2 0.02 260));
    background-color: var(--mth-color-surface, oklch(0.99 0 0));
    border: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    cursor: pointer;
  }

  button[data-tone='danger'] {
    border-color: var(--mth-color-danger, oklch(0.55 0.22 25));
    color: var(--mth-color-danger, oklch(0.55 0.22 25));
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.2 250));
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .base {
      border-color: CanvasText;
      background-color: Canvas;
      color: CanvasText;
    }

    button {
      border-color: ButtonText;
      background-color: ButtonFace;
      color: ButtonText;
    }
  }
`;
