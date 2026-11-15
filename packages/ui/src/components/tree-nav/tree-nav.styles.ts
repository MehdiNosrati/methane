import { css } from 'lit';

export const treeNavStyles = css`
  :host {
    display: block;
    --_tn-surface: var(--mth-color-surface, transparent);
    --_tn-text: var(--mth-color-fg, oklch(0.2 0.02 260));
    --_tn-muted: var(--mth-color-fg-muted, oklch(0.52 0.02 260));
    --_tn-accent-bg: var(--mth-color-accent-subtle, oklch(0.93 0.03 260));
    --_tn-primary: var(--mth-color-accent, oklch(0.55 0.18 260));
    --_tn-radius: var(--mth-radius-md, 0.375rem);
    --_tn-font-sm: var(--mth-font-size-sm, 0.875rem);
  }

  [part='nav'] {
    background: var(--_tn-surface);
  }

  [part='tree'],
  [part='group'] {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  [part='item'] {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    inline-size: 100%;
    box-sizing: border-box;
    padding-inline: 0.5rem;
    padding-block: 0.375rem;
    border: none;
    border-radius: var(--_tn-radius);
    background: transparent;
    color: var(--_tn-text);
    font: inherit;
    font-size: var(--_tn-font-sm);
    text-decoration: none;
    text-align: start;
    cursor: pointer;
  }

  [part='item'][data-depth='1'] {
    padding-inline-start: 1.5rem;
  }

  [part='item'][data-depth='2'] {
    padding-inline-start: 2.5rem;
  }

  [part='item'][data-depth='3'] {
    padding-inline-start: 3.5rem;
  }

  [part='item']:hover:not([aria-disabled='true']),
  [part='item'][aria-current='page'] {
    background: var(--_tn-accent-bg);
  }

  [part='item'][aria-current='page'] {
    color: var(--_tn-primary);
    font-weight: 600;
  }

  [part='item'][aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  [part='item']:focus-visible {
    outline: 2px solid var(--_tn-primary);
    outline-offset: -2px;
  }

  [part='chevron'] {
    display: inline-block;
    inline-size: 1em;
    color: var(--_tn-muted);
    transition: transform 0.15s ease;
  }

  @media (prefers-reduced-motion: reduce) {
    [part='chevron'] {
      transition: none;
    }
  }

  [part='item'][aria-expanded='true'] [part='chevron'] {
    transform: rotate(90deg);
  }

  [part='badge'] {
    margin-inline-start: auto;
    font-size: 0.75rem;
    color: var(--_tn-muted);
  }

  @media (forced-colors: active) {
    [part='item'][aria-current='page'] {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
