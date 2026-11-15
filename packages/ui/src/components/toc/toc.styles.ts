import { css } from 'lit';

export const tocStyles = css`
  :host {
    display: block;
    --_toc-text: var(--mth-color-fg, oklch(0.2 0.02 260));
    --_toc-muted: var(--mth-color-fg-muted, oklch(0.52 0.02 260));
    --_toc-border: var(--mth-color-border, oklch(0.86 0.01 260));
    --_toc-primary: var(--mth-color-accent, oklch(0.55 0.18 260));
    --_toc-font-sm: var(--mth-font-size-sm, 0.875rem);
    --_toc-space: var(--mth-space-2, 0.5rem);
  }

  [part='heading'] {
    margin: 0;
    margin-block-end: var(--_toc-space);
    font-size: var(--_toc-font-sm);
    font-weight: 600;
    color: var(--_toc-text);
  }

  [part='list'] {
    list-style: none;
    margin: 0;
    padding: 0;
    border-inline-start: 1px solid var(--_toc-border);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  [part='link'] {
    display: block;
    padding-inline-start: 0.75rem;
    padding-inline-end: 0.25rem;
    padding-block: 0.2rem;
    font-size: var(--_toc-font-sm);
    color: var(--_toc-muted);
    text-decoration: none;
    border-inline-start: 2px solid transparent;
    margin-inline-start: -1px;
  }

  [part='link'][data-level='3'] {
    padding-inline-start: 1.5rem;
  }

  [part='link'][data-level='4'] {
    padding-inline-start: 2.25rem;
  }

  [part='link']:hover,
  [part='link'][aria-current='location'] {
    color: var(--_toc-primary);
  }

  [part='link'][aria-current='location'] {
    border-inline-start-color: var(--_toc-primary);
    font-weight: 600;
  }

  [part='link']:focus-visible {
    outline: 2px solid var(--_toc-primary);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    [part='link'][aria-current='location'] {
      color: Highlight;
      border-inline-start-color: Highlight;
      forced-color-adjust: none;
    }
  }
`;
