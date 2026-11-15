import { css } from 'lit';

export const codeBlockStyles = css`
  :host {
    display: block;
    --_cb-surface: var(--_sat-color-surface, var(--mth-color-surface, oklch(0.99 0 0)));
    --_cb-subtle: var(--_sat-color-bg-subtle, var(--mth-color-bg-subtle, oklch(0.96 0.005 260)));
    --_cb-fg: var(--_sat-color-fg, var(--mth-color-fg, oklch(0.2 0.02 260)));
    --_cb-muted: var(--_sat-color-fg-muted, var(--mth-color-fg-muted, oklch(0.52 0.02 260)));
    --_cb-border: var(--_sat-color-border, var(--mth-color-border, oklch(0.86 0.01 260)));
    --_cb-accent: var(--_sat-color-accent, var(--mth-color-accent, oklch(0.55 0.18 260)));
    --_cb-accent-subtle: var(--mth-color-accent-subtle, oklch(0.95 0.04 260));
    --_cb-success: var(--mth-color-success, oklch(0.52 0.17 150));
    --_cb-warning: var(--mth-color-warning, oklch(0.6 0.16 65));
    --_cb-info: var(--mth-color-info, oklch(0.52 0.17 230));
    --_cb-radius: var(--mth-radius-md, 0.5rem);
    --_cb-font-mono: var(--mth-font-mono, ui-monospace, monospace);
    --_cb-font-sans: var(--mth-font-sans, system-ui, sans-serif);
    font-family: var(--_cb-font-sans);
    color: var(--_cb-fg);
  }

  [part='base'] {
    border: 1px solid var(--_cb-border);
    border-radius: var(--_cb-radius);
    background: var(--_cb-surface);
    overflow: hidden;
  }

  [part='header'] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding-block: 0.375rem;
    padding-inline: 0.75rem;
    background: var(--_cb-subtle);
    border-block-end: 1px solid var(--_cb-border);
  }

  [part='language'] {
    font-family: var(--_cb-font-mono);
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_cb-muted);
    text-transform: uppercase;
  }

  [part='copy-button'] {
    border: 1px solid var(--_cb-border);
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: var(--_cb-surface);
    color: var(--_cb-fg);
    padding-block: 0.25rem;
    padding-inline: 0.5rem;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  [part='copy-button']:focus-visible {
    outline: 2px solid var(--_cb-accent);
    outline-offset: 1px;
  }

  [part='pre'] {
    margin: 0;
    padding-block: 0.75rem;
    overflow-inline: auto;
    font-family: var(--_cb-font-mono);
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-relaxed, 1.6);
  }

  [part='code'] {
    display: block;
    font-family: inherit;
  }

  [part='line'] {
    display: flex;
    padding-inline: 0.75rem;
    white-space: pre;
  }

  [part='line'][data-highlighted='true'] {
    background: var(--_cb-accent-subtle);
  }

  [part='line-number'] {
    user-select: none;
    min-inline-size: 2.25rem;
    padding-inline-end: 0.75rem;
    color: var(--_cb-muted);
    text-align: end;
  }

  [part='token'][data-token='keyword'] {
    color: var(--_cb-accent);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  [part='token'][data-token='string'] {
    color: var(--_cb-success);
  }

  [part='token'][data-token='comment'] {
    color: var(--_cb-muted);
    font-style: italic;
  }

  [part='token'][data-token='number'] {
    color: var(--_cb-warning);
  }

  [part='token'][data-token='operator'] {
    color: var(--_cb-info);
  }

  ::highlight(mth-keyword) {
    color: var(--_cb-accent);
  }

  ::highlight(mth-string) {
    color: var(--_cb-success);
  }

  ::highlight(mth-comment) {
    color: var(--_cb-muted);
  }

  ::highlight(mth-number) {
    color: var(--_cb-warning);
  }

  ::highlight(mth-operator) {
    color: var(--_cb-info);
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  [part='source'],
  [part='fallback'] {
    display: none;
  }

  @media (forced-colors: active) {
    [part='base'] {
      border-color: CanvasText;
    }

    [part='copy-button']:focus-visible {
      outline-color: Highlight;
    }
  }
`;
