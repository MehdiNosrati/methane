import { css } from 'lit';

export const mathEditorStyles = css`
  :host {
    display: block;
    --_math-surface: var(--_sat-color-surface, var(--mth-color-surface, oklch(0.99 0 0)));
    --_math-subtle: var(--_sat-color-bg-subtle, var(--mth-color-bg-subtle, oklch(0.96 0.005 260)));
    --_math-fg: var(--_sat-color-fg, var(--mth-color-fg, oklch(0.2 0.02 260)));
    --_math-muted: var(--_sat-color-fg-muted, var(--mth-color-fg-muted, oklch(0.52 0.02 260)));
    --_math-border: var(--_sat-color-border, var(--mth-color-border, oklch(0.86 0.01 260)));
    --_math-focus: var(--_sat-color-border-focus, var(--mth-color-border-focus, oklch(0.55 0.18 260)));
    --_math-accent: var(--_sat-color-accent, var(--mth-color-accent, oklch(0.55 0.18 260)));
    --_math-danger: var(--mth-color-danger, oklch(0.55 0.22 25));
    --_math-danger-bg: var(--mth-color-danger-subtle, oklch(0.96 0.03 25));
    --_math-radius: var(--mth-radius-md, 0.5rem);
    --_math-space-2: var(--mth-space-2, 0.5rem);
    --_math-space-3: var(--mth-space-3, 0.75rem);
    --_math-font-sans: var(--mth-font-sans, system-ui, sans-serif);
    --_math-font-mono: var(--mth-font-mono, ui-monospace, monospace);
    font-family: var(--_math-font-sans);
    color: var(--_math-fg);
  }

  [part='label'] {
    display: block;
    margin-block-end: 0.375rem;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  [part='base'] {
    border: 1px solid var(--_math-border);
    border-radius: var(--_math-radius);
    background: var(--_math-surface);
    overflow: hidden;
  }

  :host(:state(invalid)) [part='base'] {
    border-color: var(--_math-danger);
  }

  :host(:state(disabled)) [part='base'] {
    opacity: 0.65;
  }

  [part='toolbar'] {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding-block: 0.375rem;
    padding-inline: var(--_math-space-2);
    background: var(--_math-subtle);
    border-block-end: 1px solid var(--_math-border);
  }

  [part='tool-button'] {
    border: 1px solid transparent;
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: transparent;
    color: var(--_math-fg);
    padding-block: 0.25rem;
    padding-inline: 0.5rem;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  [part='tool-button']:hover:not(:disabled) {
    border-color: var(--_math-border);
  }

  [part='tool-button']:focus-visible {
    outline: 2px solid var(--_math-focus);
    outline-offset: 1px;
  }

  [part='textarea'] {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: 4.5rem;
    padding: var(--_math-space-3);
    border: 0;
    border-block-end: 1px solid var(--_math-border);
    background: var(--_math-surface);
    color: var(--_math-fg);
    font-family: var(--_math-font-mono);
    font-size: var(--mth-font-size-sm, 0.875rem);
    resize: vertical;
  }

  [part='textarea']:focus-visible {
    outline: 2px solid var(--_math-focus);
    outline-offset: -2px;
  }

  [part='preview'] {
    min-block-size: 3.5rem;
    padding: var(--_math-space-3);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow-inline: auto;
  }

  [part='error'] {
    padding-block: 0.375rem;
    padding-inline: var(--_math-space-3);
    background: var(--_math-danger-bg);
    color: var(--_math-danger);
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
  }
`;
