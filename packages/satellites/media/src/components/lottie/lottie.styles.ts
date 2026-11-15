import { css } from '@methane-ui/core';

export const lottieStyles = css`
  :host {
    display: block;
    --_bg: var(--mth-color-surface, light-dark(oklch(0.99 0 0), oklch(0.18 0.01 250)));
    --_fg: var(--mth-color-fg, light-dark(oklch(0.18 0.02 250), oklch(0.96 0.005 250)));
    --_fg-muted: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.02 250), oklch(0.72 0.01 250)));
    --_border: var(--mth-color-border, light-dark(oklch(0.84 0.01 250), oklch(0.32 0.01 250)));
    --_focus: var(--mth-color-border-focus, oklch(0.55 0.22 250));
    --_accent: var(--mth-color-accent, oklch(0.55 0.22 250));
    --_accent-fg: var(--mth-color-accent-fg, light-dark(oklch(0.99 0 0), oklch(0.99 0 0)));
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
    background-color: var(--mth-color-surface-raised, light-dark(oklch(0.97 0 0), oklch(0.24 0.01 250)));
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

  @media (forced-colors: active) {
    [part='play-button'],
    [part='play-button'][aria-pressed='true'] {
      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }
  }
`;
