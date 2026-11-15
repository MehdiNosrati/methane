import { css } from 'lit';

export const diffViewerStyles = css`
  :host {
    display: block;
    --_dv-surface: var(--_sat-color-surface, var(--mth-color-surface, oklch(0.99 0 0)));
    --_dv-subtle: var(--_sat-color-bg-subtle, var(--mth-color-bg-subtle, oklch(0.96 0.005 260)));
    --_dv-fg: var(--_sat-color-fg, var(--mth-color-fg, oklch(0.2 0.02 260)));
    --_dv-muted: var(--_sat-color-fg-muted, var(--mth-color-fg-muted, oklch(0.52 0.02 260)));
    --_dv-border: var(--_sat-color-border, var(--mth-color-border, oklch(0.86 0.01 260)));
    --_dv-accent: var(--_sat-color-accent, var(--mth-color-accent, oklch(0.55 0.18 260)));
    --_dv-add-bg: var(--mth-color-success-subtle, oklch(0.95 0.05 150));
    --_dv-add-fg: var(--mth-color-success, oklch(0.45 0.17 150));
    --_dv-del-bg: var(--mth-color-danger-subtle, oklch(0.95 0.04 25));
    --_dv-del-fg: var(--mth-color-danger, oklch(0.52 0.2 25));
    --_dv-radius: var(--mth-radius-md, 0.5rem);
    --_dv-font-sans: var(--mth-font-sans, system-ui, sans-serif);
    --_dv-font-mono: var(--mth-font-mono, ui-monospace, monospace);
    font-family: var(--_dv-font-sans);
    color: var(--_dv-fg);
  }

  [part='base'] {
    border: 1px solid var(--_dv-border);
    border-radius: var(--_dv-radius);
    background: var(--_dv-surface);
    overflow: hidden;
  }

  [part='header'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding-block: 0.375rem;
    padding-inline: 0.75rem;
    background: var(--_dv-subtle);
    border-block-end: 1px solid var(--_dv-border);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .dv-meta,
  .dv-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem;
  }

  .dv-file {
    font-family: var(--_dv-font-mono);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .dv-added {
    color: var(--_dv-add-fg);
  }

  .dv-removed {
    color: var(--_dv-del-fg);
  }

  [part='tool-button'] {
    border: 1px solid var(--_dv-border);
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: var(--_dv-surface);
    color: var(--_dv-fg);
    padding-block: 0.1875rem;
    padding-inline: 0.5rem;
    font: inherit;
    cursor: pointer;
  }

  [part='tool-button'][aria-pressed='true'] {
    border-color: var(--_dv-accent);
    color: var(--_dv-accent);
  }

  [part='tool-button']:focus-visible {
    outline: 2px solid var(--_dv-accent);
    outline-offset: 1px;
  }

  [part='surface'] {
    font-family: var(--_dv-font-mono);
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-relaxed, 1.6);
    overflow-inline: auto;
  }

  [part='row'] {
    display: grid;
    grid-template-columns: 2.5rem 2.5rem 1.5rem 1fr;
    white-space: pre;
    padding-inline: 0.5rem;
  }

  :host([view='split']) [part='row'] {
    grid-template-columns: 2.5rem 1fr 2.5rem 1fr;
  }

  [part='row'][data-kind='added'] {
    background: var(--_dv-add-bg);
  }

  [part='row'][data-kind='removed'] {
    background: var(--_dv-del-bg);
  }

  [part='row'][data-active-hunk='true'] {
    outline: 1px solid var(--_dv-accent);
    outline-offset: -1px;
  }

  .dv-num {
    color: var(--_dv-muted);
    user-select: none;
    text-align: end;
    padding-inline-end: 0.5rem;
  }

  .dv-marker {
    user-select: none;
    text-align: center;
  }

  .dv-split-cell {
    overflow-wrap: anywhere;
  }

  [part='fallback'] {
    display: none;
  }

  @media (forced-colors: active) {
    [part='base'] {
      border-color: CanvasText;
    }

    [part='tool-button']:focus-visible {
      outline-color: Highlight;
    }

    [part='tool-button'][aria-pressed='true'] {
      border-color: Highlight;
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
