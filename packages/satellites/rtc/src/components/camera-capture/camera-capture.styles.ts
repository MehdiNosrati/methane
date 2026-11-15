import { css } from '@methane/core';

export const cameraCaptureStyles = css`
  :host {
    display: block;
    --_bg: var(--mth-color-surface, light-dark(oklch(0.98 0.005 260), oklch(0.18 0.01 260)));
    --_surface: var(--mth-color-surface-raised, light-dark(oklch(0.94 0.008 260), oklch(0.24 0.012 260)));
    --_fg: var(--mth-color-fg, light-dark(oklch(0.18 0.01 260), oklch(0.96 0.005 260)));
    --_fg-muted: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.01 260), oklch(0.72 0.01 260)));
    --_border: var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.32 0.01 260)));
    --_focus: var(--mth-color-border-focus, oklch(0.6 0.2 250));
    --_accent: var(--mth-color-accent, oklch(0.6 0.2 250));
    --_accent-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
    --_radius: var(--mth-radius-lg, 0.75rem);
    --_radius-sm: var(--mth-radius-sm, 0.375rem);
    --_gap: var(--mth-space-3, 0.75rem);
    color: var(--_fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--_gap);
    padding-block: var(--_gap);
    padding-inline: var(--_gap);
    background-color: var(--_bg);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
  }

  .viewport {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-block-size: 10rem;
    background-color: var(--_surface);
    border-radius: var(--_radius-sm);
    overflow: hidden;
  }

  .preview,
  .snapshot {
    display: block;
    max-inline-size: 100%;
    max-block-size: 16rem;
    object-fit: cover;
    border-radius: var(--_radius-sm);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .device-label {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_fg-muted);
  }

  .device-select,
  .action-btn {
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_border);
    border-radius: var(--_radius-sm);
    background-color: var(--_surface);
    color: var(--_fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    cursor: pointer;
  }

  .action-btn[data-primary='true'] {
    background-color: var(--_accent);
    border-color: var(--_accent);
    color: var(--_accent-fg);
  }

  .action-btn:disabled,
  .device-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .device-select:focus-visible,
  .action-btn:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .status {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_fg-muted);
  }
`;
