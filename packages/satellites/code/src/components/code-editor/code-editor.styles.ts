import { css } from 'lit';

export const codeEditorStyles = css`
  :host {
    display: block;
    --_ce-surface: var(--_sat-color-surface, var(--mth-color-surface, oklch(0.99 0 0)));
    --_ce-subtle: var(--_sat-color-bg-subtle, var(--mth-color-bg-subtle, oklch(0.96 0.005 260)));
    --_ce-fg: var(--_sat-color-fg, var(--mth-color-fg, oklch(0.2 0.02 260)));
    --_ce-muted: var(--_sat-color-fg-muted, var(--mth-color-fg-muted, oklch(0.52 0.02 260)));
    --_ce-border: var(--_sat-color-border, var(--mth-color-border, oklch(0.86 0.01 260)));
    --_ce-focus: var(--_sat-color-border-focus, var(--mth-color-border-focus, oklch(0.55 0.18 260)));
    --_ce-accent: var(--_sat-color-accent, var(--mth-color-accent, oklch(0.55 0.18 260)));
    --_ce-danger: var(--mth-color-danger, oklch(0.55 0.22 25));
    --_ce-radius: var(--mth-radius-md, 0.5rem);
    --_ce-font-sans: var(--mth-font-sans, system-ui, sans-serif);
    --_ce-font-mono: var(--mth-font-mono, ui-monospace, monospace);
    font-family: var(--_ce-font-sans);
    color: var(--_ce-fg);
  }

  [part='label'] {
    display: block;
    margin-block-end: 0.375rem;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  [part='base'] {
    border: 1px solid var(--_ce-border);
    border-radius: var(--_ce-radius);
    background: var(--_ce-surface);
    overflow: hidden;
  }

  :host(:state(invalid)) [part='base'] {
    border-color: var(--_ce-danger);
  }

  :host(:state(disabled)) [part='base'] {
    opacity: 0.65;
  }

  [part='header'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding-block: 0.375rem;
    padding-inline: 0.75rem;
    background: var(--_ce-subtle);
    border-block-end: 1px solid var(--_ce-border);
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_ce-muted);
  }

  .ce-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  [part='tab-toggle'] {
    border: 1px solid var(--_ce-border);
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: var(--_ce-surface);
    color: var(--_ce-fg);
    padding-block: 0.1875rem;
    padding-inline: 0.5rem;
    font: inherit;
    cursor: pointer;
  }

  [part='tab-toggle'][aria-pressed='true'] {
    border-color: var(--_ce-accent);
    color: var(--_ce-accent);
  }

  [part='tab-toggle']:focus-visible {
    outline: 2px solid var(--_ce-focus);
    outline-offset: 1px;
  }

  [part='surface'] {
    min-block-size: 9rem;
    font-family: var(--_ce-font-mono);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  [part='surface'] .cm-editor {
    min-block-size: 9rem;
    font-family: inherit;
  }

  [part='fallback'] {
    display: none;
  }

  @media (forced-colors: active) {
    [part='base'] {
      border-color: CanvasText;
    }

    [part='tab-toggle']:focus-visible {
      outline-color: Highlight;
    }

    [part='tab-toggle'][aria-pressed='true'] {
      border-color: Highlight;
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
