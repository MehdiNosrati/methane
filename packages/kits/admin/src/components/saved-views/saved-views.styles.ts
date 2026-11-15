import { css } from 'lit';

export const savedViewsStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, oklch(0.2 0.02 260));
    background-color: var(--mth-color-surface, oklch(0.99 0 0));
    border-block-end: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
  }

  .base {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
  }

  .tablist {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--mth-space-1, 0.25rem);
  }

  .tab,
  .action-btn {
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg, oklch(0.2 0.02 260));
    background-color: var(--mth-color-surface-raised, oklch(0.96 0.01 260));
    border: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    cursor: pointer;
  }

  .tab[aria-selected='true'] {
    background-color: var(--mth-color-accent, oklch(0.6 0.2 250));
    color: var(--mth-color-accent-fg, oklch(0.99 0 0));
    border-color: var(--mth-color-accent, oklch(0.6 0.2 250));
  }

  .tab:focus-visible,
  .action-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.2 250));
    outline-offset: 2px;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
  }

  .action-btn[hidden] {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    button {
      border-color: ButtonText;
      background-color: ButtonFace;
      color: ButtonText;
    }

    .tab[aria-selected='true'] {
      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }
  }
`;
