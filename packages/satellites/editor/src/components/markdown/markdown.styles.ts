import { css } from 'lit';

export const markdownStyles = css`
  :host {
    display: block;
    --_md-surface: var(--_sat-color-surface, var(--mth-color-surface, oklch(0.99 0 0)));
    --_md-subtle: var(--_sat-color-bg-subtle, var(--mth-color-bg-subtle, oklch(0.96 0.005 260)));
    --_md-fg: var(--_sat-color-fg, var(--mth-color-fg, oklch(0.2 0.02 260)));
    --_md-muted: var(--_sat-color-fg-muted, var(--mth-color-fg-muted, oklch(0.52 0.02 260)));
    --_md-border: var(--_sat-color-border, var(--mth-color-border, oklch(0.86 0.01 260)));
    --_md-accent: var(--_sat-color-accent, var(--mth-color-accent, oklch(0.55 0.18 260)));
    --_md-font-sans: var(--mth-font-sans, system-ui, sans-serif);
    --_md-font-mono: var(--mth-font-mono, ui-monospace, monospace);
    font-family: var(--_md-font-sans);
    color: var(--_md-fg);
  }

  [part='base'] {
    color: var(--_md-fg);
    line-height: var(--mth-line-height-relaxed, 1.6);
  }

  [part='content'] {
    overflow-wrap: anywhere;
  }

  [part='content'] h1,
  [part='content'] h2,
  [part='content'] h3 {
    margin: 0;
    margin-block: 0.75em 0.375em;
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  [part='content'] p {
    margin: 0;
    margin-block-end: 0.75em;
  }

  [part='content'] pre {
    margin: 0;
    margin-block-end: 0.75em;
    padding: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_md-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--_md-subtle);
    font-family: var(--_md-font-mono);
    overflow-inline: auto;
  }

  [part='content'] code {
    font-family: var(--_md-font-mono);
    background: var(--_md-subtle);
    padding-block: 0.125rem;
    padding-inline: 0.25rem;
    border-radius: var(--mth-radius-xs, 0.25rem);
  }

  [part='content'] pre code {
    background: transparent;
    padding: 0;
  }

  [part='content'] a {
    color: var(--_md-accent);
  }

  [part='source'],
  [part='fallback'] {
    display: none;
  }

  @media (forced-colors: active) {
    [part='content'] a {
      color: LinkText;
    }

    [part='content'] pre {
      border-color: CanvasText;
    }
  }
`;
