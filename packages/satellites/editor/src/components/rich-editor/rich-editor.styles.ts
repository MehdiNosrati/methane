import { css } from 'lit';

export const richEditorStyles = css`
  :host {
    display: block;
    --_re-surface: var(--_sat-color-surface, var(--mth-color-surface, oklch(1 0 0)));
    --_re-subtle: var(--_sat-color-bg-subtle, var(--mth-color-bg-subtle, oklch(0.96 0.005 260)));
    --_re-fg: var(--_sat-color-fg, var(--mth-color-fg, oklch(0.2 0.02 260)));
    --_re-muted: var(--_sat-color-fg-muted, var(--mth-color-fg-muted, oklch(0.5 0.02 260)));
    --_re-border: var(--_sat-color-border, var(--mth-color-border, oklch(0.84 0.01 260)));
    --_re-focus: var(--_sat-color-border-focus, var(--mth-color-border-focus, oklch(0.55 0.18 260)));
    --_re-accent: var(--_sat-color-accent, var(--mth-color-accent, oklch(0.55 0.18 260)));
    --_re-radius: var(--mth-radius-md, 0.375rem);
    --_re-font: var(--mth-font-sans, sans-serif);
    --_re-font-md: var(--mth-font-size-md, 1rem);
  }

  :host(:state(disabled)) {
    opacity: 0.6;
  }

  [part='label'] {
    display: block;
    margin-block-end: 0.375rem;
    font-family: var(--_re-font);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--_re-fg);
  }

  [part='base'] {
    border: 1px solid var(--_re-border);
    border-radius: var(--_re-radius);
    background: var(--_re-surface);
    color: var(--_re-fg);
    font-family: var(--_re-font);
    overflow: hidden;
  }

  [part='base']:focus-within {
    border-color: var(--_re-focus);
    outline: 2px solid var(--_re-focus);
    outline-offset: -1px;
  }

  [part='toolbar'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
    padding-inline: 0.5rem;
    padding-block: 0.375rem;
    background: var(--_re-subtle);
    border-block-end: 1px solid var(--_re-border);
  }

  [part='tool-button'] {
    padding-inline: 0.5rem;
    padding-block: 0.25rem;
    border: 1px solid transparent;
    border-radius: var(--_re-radius);
    background: transparent;
    color: var(--_re-fg);
    font: inherit;
    font-size: 0.875rem;
    cursor: pointer;
  }

  [part='tool-button'][aria-pressed='true'] {
    background: var(--_re-surface);
    border-color: var(--_re-accent);
    color: var(--_re-accent);
  }

  [part='tool-button']:focus-visible {
    outline: 2px solid var(--_re-focus);
    outline-offset: 1px;
  }

  [part='surface'] {
    min-block-size: 8rem;
    padding: 0.75rem;
    font-size: var(--_re-font-md);
    outline: none;
  }

  [part='surface'] .ProseMirror {
    outline: none;
    min-block-size: 6.5rem;
  }

  [part='surface'] .ProseMirror p {
    margin-block: 0 0.5rem;
  }

  [part='fallback'] {
    display: none;
  }

  @media (forced-colors: active) {
    [part='base'] {
      background: Canvas;
      color: CanvasText;
      border-color: CanvasText;
    }

    [part='tool-button'][aria-pressed='true'] {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
