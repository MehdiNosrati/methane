import { css } from '@methane/core';

export const waveformStyles = css`
  :host {
    display: block;
    --_bg: var(--mth-color-surface, oklch(0.99 0 0));
    --_fg: var(--mth-color-fg, oklch(0.18 0.02 250));
    --_fg-muted: var(--mth-color-fg-muted, oklch(0.45 0.02 250));
    --_border: var(--mth-color-border, oklch(0.84 0.01 250));
    --_focus: var(--mth-color-border-focus, oklch(0.55 0.22 250));
    --_accent: var(--mth-color-accent, oklch(0.55 0.22 250));
    --_accent-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
    --_bar-idle: var(--mth-color-border, oklch(0.84 0.01 250));
    --_radius: var(--mth-radius-md, 0.5rem);
    --_pad: var(--mth-space-3, 0.75rem);
    --_gap: var(--mth-space-3, 0.75rem);
    --_progress-pct: 0%;
    color: var(--_fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  [part='base'] {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--_pad);
    padding-inline: var(--_pad);
    background-color: var(--_bg);
    border-width: 1px;
    border-style: solid;
    border-color: var(--_border);
    border-radius: var(--_radius);
  }

  [part='controls'] {
    display: flex;
    align-items: center;
    gap: var(--_gap);
  }

  [part='play-button'] {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2.25rem;
    min-block-size: 2.25rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border-width: 1px;
    border-style: solid;
    border-color: var(--_accent);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background-color: var(--_accent);
    color: var(--_accent-fg);
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: 600;
    cursor: pointer;
  }

  [part='play-button']:focus-visible,
  [part='scrubber']:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-color: var(--_focus);
    outline-offset: 2px;
  }

  [part='play-button']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  [part='scrubber'] {
    position: relative;
    flex: 1 1 auto;
    min-inline-size: 0;
    block-size: 3rem;
    border-radius: var(--mth-radius-sm, 0.25rem);
    overflow: hidden;
    cursor: pointer;
    user-select: none;
  }

  :host([disabled]) [part='scrubber'] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  [part='bars'] {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  .bar-unplayed {
    fill: var(--_bar-idle);
  }

  .bar-played {
    fill: var(--_accent);
  }

  [part='progress'] {
    position: absolute;
    inset-block: 0;
    inset-inline-start: var(--_progress-pct);
    inline-size: 2px;
    background-color: var(--_accent);
    pointer-events: none;
    transition: inset-inline-start var(--mth-motion-duration-fast, 100ms) linear;
  }

  [part='time'] {
    flex-shrink: 0;
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_fg-muted);
    font-variant-numeric: tabular-nums;
  }

  [part='status-row'] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_fg-muted);
  }

  @media (prefers-reduced-motion: reduce) {
    [part='progress'] {
      transition: none;
    }
  }
`;
