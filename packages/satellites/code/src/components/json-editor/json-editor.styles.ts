import { css } from 'lit';

export const jsonEditorStyles = css`
  :host {
    display: block;
    --_je-surface: var(--_sat-color-surface, var(--mth-color-surface, oklch(0.99 0 0)));
    --_je-subtle: var(--_sat-color-bg-subtle, var(--mth-color-bg-subtle, oklch(0.96 0.005 260)));
    --_je-fg: var(--_sat-color-fg, var(--mth-color-fg, oklch(0.2 0.02 260)));
    --_je-muted: var(--_sat-color-fg-muted, var(--mth-color-fg-muted, oklch(0.52 0.02 260)));
    --_je-border: var(--_sat-color-border, var(--mth-color-border, oklch(0.86 0.01 260)));
    --_je-focus: var(--_sat-color-border-focus, var(--mth-color-border-focus, oklch(0.55 0.18 260)));
    --_je-accent: var(--_sat-color-accent, var(--mth-color-accent, oklch(0.55 0.18 260)));
    --_je-danger: var(--mth-color-danger, oklch(0.55 0.22 25));
    --_je-danger-bg: var(--mth-color-danger-subtle, oklch(0.96 0.03 25));
    --_je-success: var(--mth-color-success, oklch(0.5 0.16 150));
    --_je-radius: var(--mth-radius-md, 0.5rem);
    --_je-font-sans: var(--mth-font-sans, system-ui, sans-serif);
    --_je-font-mono: var(--mth-font-mono, ui-monospace, monospace);
    font-family: var(--_je-font-sans);
    color: var(--_je-fg);
  }

  [part='label'] {
    display: block;
    margin-block-end: 0.375rem;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  [part='base'] {
    border: 1px solid var(--_je-border);
    border-radius: var(--_je-radius);
    background: var(--_je-surface);
    overflow: hidden;
  }

  :host(:state(invalid)) [part='base'] {
    border-color: var(--_je-danger);
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
    padding-inline: 0.75rem;
    background: var(--_je-subtle);
    border-block-end: 1px solid var(--_je-border);
  }

  .je-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  [part='tool-button'] {
    border: 1px solid var(--_je-border);
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: var(--_je-surface);
    color: var(--_je-fg);
    padding-block: 0.1875rem;
    padding-inline: 0.5rem;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  [part='tool-button'][aria-pressed='true'] {
    border-color: var(--_je-accent);
    color: var(--_je-accent);
  }

  [part='tool-button']:focus-visible {
    outline: 2px solid var(--_je-focus);
    outline-offset: 1px;
  }

  [part='panes'] {
    display: grid;
    grid-template-columns: 1fr;
  }

  :host([mode='split']) [part='panes'] {
    grid-template-columns: 1fr 1fr;
  }

  [part='surface'] {
    min-block-size: 9rem;
    font-family: var(--_je-font-mono);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  [part='surface'] .cm-editor {
    min-block-size: 9rem;
    font-family: inherit;
  }

  :host([mode='split']) [part='surface'] {
    border-inline-end: 1px solid var(--_je-border);
  }

  [part='tree'] {
    min-block-size: 9rem;
    padding: 0.75rem;
    font-family: var(--_je-font-mono);
    font-size: var(--mth-font-size-xs, 0.75rem);
    overflow-inline: auto;
  }

  .je-node {
    padding-inline-start: 0.75rem;
  }

  .je-key {
    color: var(--_je-accent);
  }

  .je-primitive {
    color: var(--_je-success);
  }

  [part='error'] {
    padding-block: 0.375rem;
    padding-inline: 0.75rem;
    background: var(--_je-danger-bg);
    color: var(--_je-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
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
