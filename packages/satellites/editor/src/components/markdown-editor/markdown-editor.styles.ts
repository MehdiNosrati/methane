import { css } from 'lit';

export const markdownEditorStyles = css`
  :host {
    display: block;
    --_me-surface: var(--_sat-color-surface, var(--mth-color-surface, oklch(0.99 0 0)));
    --_me-subtle: var(--_sat-color-bg-subtle, var(--mth-color-bg-subtle, oklch(0.96 0.005 260)));
    --_me-fg: var(--_sat-color-fg, var(--mth-color-fg, oklch(0.2 0.02 260)));
    --_me-muted: var(--_sat-color-fg-muted, var(--mth-color-fg-muted, oklch(0.52 0.02 260)));
    --_me-border: var(--_sat-color-border, var(--mth-color-border, oklch(0.86 0.01 260)));
    --_me-focus: var(--_sat-color-border-focus, var(--mth-color-border-focus, oklch(0.55 0.18 260)));
    --_me-accent: var(--_sat-color-accent, var(--mth-color-accent, oklch(0.55 0.18 260)));
    --_me-danger: var(--mth-color-danger, oklch(0.55 0.22 25));
    --_me-radius: var(--mth-radius-md, 0.5rem);
    --_me-space-2: var(--mth-space-2, 0.5rem);
    --_me-space-3: var(--mth-space-3, 0.75rem);
    --_me-font-sans: var(--mth-font-sans, system-ui, sans-serif);
    --_me-font-mono: var(--mth-font-mono, ui-monospace, monospace);
    font-family: var(--_me-font-sans);
    color: var(--_me-fg);
  }

  [part='label'] {
    display: block;
    margin-block-end: 0.375rem;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  [part='base'] {
    border: 1px solid var(--_me-border);
    border-radius: var(--_me-radius);
    background: var(--_me-surface);
    overflow: hidden;
  }

  :host(:state(invalid)) [part='base'] {
    border-color: var(--_me-danger);
  }

  :host(:state(disabled)) [part='base'] {
    opacity: 0.65;
  }

  [part='header'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.375rem;
    padding-block: 0.375rem;
    padding-inline: var(--_me-space-2);
    background: var(--_me-subtle);
    border-block-end: 1px solid var(--_me-border);
  }

  [part='toolbar'],
  .me-modes {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  [part='tool-button'] {
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: transparent;
    color: var(--_me-fg);
    padding-block: 0.25rem;
    padding-inline: 0.5rem;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  [part='tool-button'][aria-pressed='true'] {
    border-color: var(--_me-accent);
    color: var(--_me-accent);
    background: var(--mth-color-accent-subtle, oklch(0.95 0.04 260));
  }

  [part='tool-button']:focus-visible {
    outline: 2px solid var(--_me-focus);
    outline-offset: 1px;
  }

  [part='panes'] {
    display: grid;
    grid-template-columns: 1fr;
  }

  :host([mode='split']) [part='panes'] {
    grid-template-columns: 1fr 1fr;
  }

  [part='textarea'] {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: 9rem;
    padding: var(--_me-space-3);
    border: 0;
    background: var(--_me-surface);
    color: var(--_me-fg);
    font-family: var(--_me-font-mono);
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-relaxed, 1.6);
    resize: vertical;
  }

  :host([mode='split']) [part='textarea'] {
    border-inline-end: 1px solid var(--_me-border);
  }

  [part='textarea']:focus-visible {
    outline: 2px solid var(--_me-focus);
    outline-offset: -2px;
  }

  [part='preview'] {
    min-block-size: 9rem;
    padding: var(--_me-space-3);
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-relaxed, 1.6);
    overflow-wrap: anywhere;
  }

  [part='preview'] a {
    color: var(--_me-accent);
  }

  [part='preview'] code {
    font-family: var(--_me-font-mono);
    background: var(--_me-subtle);
    padding-block: 0.125rem;
    padding-inline: 0.25rem;
    border-radius: var(--mth-radius-xs, 0.25rem);
  }

  [part='fallback'] {
    display: none;
  }

  @media (forced-colors: active) {
    [part='base'] {
      border-color: CanvasText;
    }

    [part='tool-button'][aria-pressed='true'] {
      border-color: Highlight;
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
