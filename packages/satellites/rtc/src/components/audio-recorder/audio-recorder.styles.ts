import { css } from '@methane/core';

export const audioRecorderStyles = css`
  :host {
    display: block;
    --_bg: var(--mth-color-surface, light-dark(oklch(0.98 0.005 260), oklch(0.18 0.01 260)));
    --_surface: var(--mth-color-surface-raised, light-dark(oklch(0.94 0.008 260), oklch(0.24 0.012 260)));
    --_fg: var(--mth-color-fg, light-dark(oklch(0.18 0.01 260), oklch(0.96 0.005 260)));
    --_fg-muted: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.01 260), oklch(0.72 0.01 260)));
    --_border: var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.32 0.01 260)));
    --_focus: var(--mth-color-border-focus, oklch(0.6 0.2 250));
    --_accent: var(--mth-color-accent, oklch(0.6 0.2 250));
    --_danger: var(--mth-color-danger, oklch(0.58 0.22 25));
    --_danger-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
    --_radius: var(--mth-radius-lg, 0.75rem);
    --_radius-sm: var(--mth-radius-sm, 0.375rem);
    --_meter-pct: 0%;
    color: var(--_fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    background-color: var(--_bg);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
  }

  .top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  .btn {
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

  .btn[data-role='record'] {
    background-color: var(--_danger);
    border-color: var(--_danger);
    color: var(--_danger-fg);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .timer {
    font-family: var(--mth-font-mono, monospace);
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .meter {
    inline-size: 100%;
    block-size: 0.5rem;
    border-radius: var(--mth-radius-full, 9999px);
    background-color: var(--_surface);
    overflow: hidden;
  }

  .meter-fill {
    inline-size: var(--_meter-pct);
    block-size: 100%;
    background-color: var(--_accent);
  }

  .status {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_fg-muted);
  }

  .audio-preview {
    inline-size: 100%;
  }

  @media (forced-colors: active) {
    .meter {
      border: 1px solid CanvasText;
    }

    .meter-fill {
      forced-color-adjust: none;
      background-color: Highlight;
    }

    .action-btn[aria-pressed='true'] {
      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }
  }
`;
