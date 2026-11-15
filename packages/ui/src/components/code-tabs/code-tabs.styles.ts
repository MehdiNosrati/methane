import { css } from 'lit';

export const codeTabsStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_ct-bg: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.18 0.01 260)));
    --_ct-header-bg: var(--mth-color-bg-subtle, light-dark(oklch(0.96 0.005 260), oklch(0.24 0.01 260)));
    --_ct-border: var(--mth-color-border, light-dark(oklch(0.9 0.008 260), oklch(0.32 0.015 260)));
    --_ct-fg: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
    --_ct-fg-muted: var(--mth-color-fg-muted, light-dark(oklch(0.45 0.015 260), oklch(0.74 0.012 260)));
    --_ct-accent: var(--mth-color-accent, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)));
    --_ct-focus: var(--mth-color-border-focus, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)));
    --_ct-radius: var(--mth-radius-md, 0.5rem);
  }

  [part='base'] {
    border: 1px solid var(--_ct-border);
    border-radius: var(--_ct-radius);
    background-color: var(--_ct-bg);
    color: var(--_ct-fg);
    overflow: hidden;
  }

  [part='header'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    background-color: var(--_ct-header-bg);
    border-block-end: 1px solid var(--_ct-border);
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.25rem);
  }

  [part='tablist'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    min-inline-size: 0;
  }

  [part='tab'] {
    appearance: none;
    background: transparent;
    color: var(--_ct-fg-muted);
    border: 1px solid transparent;
    border-block-end: 2px solid transparent;
    border-radius: var(--mth-radius-sm, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-1, 0.25rem);
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    line-height: var(--mth-line-height-normal, 1.5);
    cursor: pointer;
  }

  [part='tab'][aria-selected='true'] {
    color: var(--_ct-accent);
    background-color: var(--_ct-bg);
    border-block-end-color: var(--_ct-accent);
  }

  [part='tab']:focus-visible,
  [part='copy-button']:focus-visible {
    outline: 2px solid var(--_ct-focus);
    outline-offset: 2px;
  }

  [part='copy-button'] {
    appearance: none;
    background-color: var(--_ct-bg);
    color: var(--_ct-fg);
    border: 1px solid var(--_ct-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.25rem);
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  [part='panel'] {
    margin: 0;
    padding-inline: var(--mth-space-4, 1rem);
    padding-block: var(--mth-space-3, 0.75rem);
    overflow-inline: auto;
    text-align: start;
  }

  [part='panel'] pre {
    margin: 0;
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-relaxed, 1.625);
  }

  [part='code'] {
    font-family: inherit;
    white-space: pre;
  }

  .mth-code-tabs__slot {
    display: none;
  }

  @media (forced-colors: active) {
    [part='base'],
    [part='copy-button'] {
      border-color: CanvasText;
    }

    [part='tab'][aria-selected='true'] {
      border-color: Highlight;
      border-block-end-color: Highlight;
      color: Highlight;
    }

    [part='tab']:focus-visible,
    [part='copy-button']:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
