import { css } from 'lit';

export const audioPlayerStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.2 0.02 250), oklch(0.92 0.01 250)));
  }

  .base {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.82 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.18 0.01 250)));
  }

  .meta {
    display: flex;
    flex-direction: column;
    min-inline-size: 6rem;
    max-inline-size: 14rem;
  }

  .title {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .artist {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.01 250), oklch(0.72 0.01 250)));
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2rem;
    min-block-size: 2rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.82 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-radius-full, 9999px);
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .seek {
    flex: 1 1 8rem;
    min-inline-size: 5rem;
  }

  .time {
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-xs, 0.75rem);
    white-space: nowrap;
  }

  .btn:focus-visible,
  .seek:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.2 255), oklch(0.72 0.18 255)));
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .base,
    .btn {
      border-color: ButtonText;
    }
  }
`;
