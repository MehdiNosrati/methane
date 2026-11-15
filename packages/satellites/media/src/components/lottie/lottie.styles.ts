import { css } from '@methane/core';

export const lottieStyles = css`
  :host {
    display: block;
    --_bg: var(--mth-color-surface, oklch(0.99 0 0));
    --_fg: var(--mth-color-fg, oklch(0.18 0.02 250));
    --_fg-muted: var(--mth-color-fg-muted, oklch(0.45 0.02 250));
    --_border: var(--mth-color-border, oklch(0.84 0.01 250));
    --_focus: var(--mth-color-border-focus, oklch(0.55 0.22 250));
    --_accent: var(--mth-color-accent, oklch(0.55 0.22 250));
    --_accent-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
    --_radius: var(--mth-radius-md, 0.5rem);
    color: var(--_fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  [part='base'] {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    background-color: var(--_bg);
    border-width: 1px;
    border-style: solid;
    border-color: var(--_border);
    border-radius: var(--_radius);
  }

  [part='canvas'] {
    display: block;
    inline-size: 100%;
    block-size: 12rem;
    border-radius: var(--mth-radius-sm, 0.25rem);
    background-color: var(--mth-color-surface-raised, oklch(0.97 0 0));
  }

  [part='controls'] {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  [part='play-button'],
  [part='stop-button'] {
    min-block-size: 2rem;
    padding-inline: var(--mth-space-3, 0.75rem);
    border-width: 1px;
    border-style: solid;
    border-color: var(--_border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background-color: var(--_bg);
    color: var(--_fg);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: 600;
    cursor: pointer;
  }

  [part='play-button'] {
    background-color: var(--_accent);
    border-color: var(--_accent);
    color: var(--_accent-fg);
  }

  [part='play-button']:focus-visible,
  [part='stop-button']:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-color: var(--_focus);
    outline-offset: 2px;
  }

  [part='play-button']:disabled,
  [part='stop-button']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  [part='status'] {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_fg-muted);
  }
`;
