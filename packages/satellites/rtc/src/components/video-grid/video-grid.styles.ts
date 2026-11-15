import { css } from '@methane/core';

export const videoGridStyles = css`
  :host {
    display: block;
    --_bg: var(--mth-color-surface, light-dark(oklch(0.98 0.005 260), oklch(0.18 0.01 260)));
    --_surface: var(--mth-color-surface-raised, light-dark(oklch(0.95 0.008 260), oklch(0.24 0.012 260)));
    --_fg: var(--mth-color-fg, light-dark(oklch(0.18 0.01 260), oklch(0.96 0.005 260)));
    --_fg-muted: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.01 260), oklch(0.72 0.01 260)));
    --_border: var(--mth-color-border, light-dark(oklch(0.86 0.01 260), oklch(0.32 0.01 260)));
    --_focus: var(--mth-color-border-focus, oklch(0.6 0.2 250));
    --_accent: var(--mth-color-accent, oklch(0.6 0.2 250));
    --_danger: var(--mth-color-danger, oklch(0.58 0.22 25));
    --_radius: var(--mth-radius-lg, 0.75rem);
    --_radius-sm: var(--mth-radius-sm, 0.375rem);
    --_gap: var(--mth-space-3, 0.75rem);
    --_cols: repeat(auto-fit, minmax(12rem, 1fr));
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

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .layout-group {
    display: inline-flex;
    gap: var(--mth-space-1, 0.25rem);
  }

  .layout-btn,
  .pin-btn {
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--_border);
    border-radius: var(--_radius-sm);
    background-color: var(--_surface);
    color: var(--_fg);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .layout-btn[aria-pressed='true'],
  .pin-btn[aria-pressed='true'] {
    border-color: var(--_accent);
    color: var(--_accent);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .layout-btn:focus-visible,
  .pin-btn:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .grid {
    display: grid;
    grid-template-columns: var(--_cols);
    gap: var(--_gap);
  }

  .stage {
    border: 2px solid var(--_accent);
    border-radius: var(--_radius);
    padding-block: var(--_gap);
    padding-inline: var(--_gap);
    background-color: var(--_surface);
  }

  .tile {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-block-size: 9rem;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    background-color: var(--_surface);
    border: 1px solid var(--_border);
    border-radius: var(--_radius-sm);
    overflow: hidden;
  }

  .tile[data-speaking='true'] {
    border-color: var(--_accent);
    box-shadow: inset 0 0 0 1px var(--_accent);
  }

  .video-el {
    inline-size: 100%;
    block-size: 6.5rem;
    object-fit: cover;
    border-radius: var(--_radius-sm);
    background-color: var(--_bg);
  }

  .avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    inline-size: 100%;
    block-size: 6.5rem;
    border-radius: var(--_radius-sm);
    background-color: var(--_bg);
    color: var(--_fg-muted);
    font-size: var(--mth-font-size-lg, 1.125rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .tile-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    margin-block-start: var(--mth-space-2, 0.5rem);
  }

  .participant-name {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    color: var(--_fg);
  }

  .badges {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
  }

  .badge {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_fg-muted);
  }

  .badge[data-state='muted'] {
    color: var(--_danger);
  }

  .empty {
    padding-block: var(--mth-space-6, 1.5rem);
    padding-inline: var(--mth-space-4, 1rem);
    text-align: center;
    color: var(--_fg-muted);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }
`;
