import { css } from '@methane-ui/core';

export const imageAnnotatorStyles = css`
  :host {
    display: block;
    --_bg: var(--mth-color-surface, light-dark(oklch(0.99 0 0), oklch(0.18 0.01 250)));
    --_surface: var(--mth-color-surface-raised, light-dark(oklch(0.97 0 0), oklch(0.24 0.01 250)));
    --_fg: var(--mth-color-fg, light-dark(oklch(0.18 0.02 250), oklch(0.96 0.005 250)));
    --_fg-muted: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.02 250), oklch(0.72 0.01 250)));
    --_border: var(--mth-color-border, light-dark(oklch(0.84 0.01 250), oklch(0.32 0.01 250)));
    --_focus: var(--mth-color-border-focus, oklch(0.55 0.22 250));
    --_accent: var(--mth-color-accent, oklch(0.55 0.22 250));
    --_accent-subtle: var(--mth-color-accent-subtle, light-dark(oklch(0.94 0.04 250), oklch(0.28 0.06 250)));
    --_accent-fg: var(--mth-color-accent-fg, light-dark(oklch(0.99 0 0), oklch(0.99 0 0)));
    --_stroke: var(--mth-color-accent, oklch(0.55 0.22 250));
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

  [part='toolbar'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .tool-btn {
    min-block-size: 2rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border-width: 1px;
    border-style: solid;
    border-color: var(--_border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background-color: var(--_bg);
    color: var(--_fg);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: 500;
    cursor: pointer;
  }

  .tool-btn[aria-pressed='true'] {
    background-color: var(--_accent);
    border-color: var(--_accent);
    color: var(--_accent-fg);
  }

  .tool-btn:focus-visible,
  [part='annotation-item']:focus-visible {
    outline-width: 2px;
    outline-style: solid;
    outline-color: var(--_focus);
    outline-offset: 2px;
  }

  .tool-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  [part='stage'] {
    position: relative;
    inline-size: 100%;
    min-block-size: 12rem;
    background-color: var(--_surface);
    border-width: 1px;
    border-style: solid;
    border-color: var(--_border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    overflow: hidden;
  }

  [part='image'] {
    display: block;
    inline-size: 100%;
    block-size: auto;
    user-select: none;
  }

  [part='overlay'] {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    touch-action: none;
  }

  .shape {
    fill: none;
    stroke: var(--_stroke);
    stroke-width: 2.5;
  }

  .shape-label {
    fill: var(--_fg);
    font-size: 13px;
    font-weight: 600;
  }

  [part='annotation-list'] {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
    margin-block-start: var(--mth-space-1, 0.25rem);
  }

  [part='annotation-item'] {
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border-width: 1px;
    border-style: solid;
    border-color: var(--_border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background-color: var(--_surface);
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  [part='annotation-item'][aria-selected='true'] {
    background-color: var(--_accent-subtle);
    border-color: var(--_accent);
  }

  [part='status'] {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_fg-muted);
  }

  @media (forced-colors: active) {
    .tool-btn[aria-pressed='true'],
    [part='annotation-item'][aria-selected='true'] {
      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }

    .shape {
      forced-color-adjust: none;
      stroke: Highlight;
    }
  }
`;
