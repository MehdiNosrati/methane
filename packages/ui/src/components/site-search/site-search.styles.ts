import { css } from 'lit';

export const siteSearchStyles = css`
  :host {
    display: inline-block;
    position: relative;
    inline-size: min(24rem, 100%);
    --_ss-surface: var(--mth-color-surface, oklch(1 0 0));
    --_ss-subtle: var(--mth-color-bg-subtle, oklch(0.97 0.005 260));
    --_ss-text: var(--mth-color-fg, oklch(0.2 0.02 260));
    --_ss-muted: var(--mth-color-fg-muted, oklch(0.52 0.02 260));
    --_ss-border: var(--mth-color-border, oklch(0.85 0.01 260));
    --_ss-primary: var(--mth-color-accent, oklch(0.55 0.18 260));
    --_ss-danger: var(--mth-color-danger, oklch(0.55 0.2 25));
    --_ss-radius: var(--mth-radius-md, 0.375rem);
    --_ss-space-sm: var(--mth-space-2, 0.5rem);
    --_ss-space-md: var(--mth-space-3, 0.75rem);
    --_ss-shadow: var(--mth-shadow-md, 0 8px 24px oklch(0.15 0.02 260 / 0.14));
    --_ss-font-md: var(--mth-font-size-md, 1rem);
    --_ss-font-sm: var(--mth-font-size-sm, 0.875rem);
    --_ss-z: var(--mth-z-index-popover, 500);
  }

  [part='combobox'] {
    display: flex;
    align-items: center;
    gap: var(--_ss-space-sm);
    inline-size: 100%;
    box-sizing: border-box;
    padding-inline: var(--_ss-space-md);
    padding-block: 0.375rem;
    border: 1px solid var(--_ss-border);
    border-radius: var(--_ss-radius);
    background: var(--_ss-surface);
    color: var(--_ss-text);
  }

  [part='combobox']:focus-within {
    border-color: var(--_ss-primary);
    outline: 2px solid var(--_ss-primary);
    outline-offset: -1px;
  }

  [part='input'] {
    flex: 1 1 auto;
    min-inline-size: 0;
    border: none;
    outline: none;
    background: transparent;
    color: inherit;
    font-size: var(--_ss-font-md);
  }

  [part='popup'] {
    box-sizing: border-box;
    inline-size: min(28rem, calc(100vw - 2rem));
    max-block-size: 22rem;
    overflow-block: auto;
    margin: 0;
    padding: var(--_ss-space-sm);
    border: 1px solid var(--_ss-border);
    border-radius: var(--_ss-radius);
    background: var(--_ss-surface);
    color: var(--_ss-text);
    box-shadow: var(--_ss-shadow);
    z-index: var(--_ss-z);
  }

  [part='popup'][hidden] {
    display: none;
  }

  [part='listbox'] {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  [part='option'] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--_ss-space-sm);
    padding-inline: var(--_ss-space-sm);
    padding-block: 0.5rem;
    border-radius: var(--_ss-radius);
    font-size: var(--_ss-font-sm);
    cursor: pointer;
    text-decoration: none;
    color: inherit;
  }

  [part='option']:hover,
  [part='option'][data-active='true'],
  [part='option'][aria-selected='true'] {
    background: var(--_ss-subtle);
  }

  [part='option'][data-active='true'] {
    outline: 2px solid var(--_ss-primary);
    outline-offset: -2px;
  }

  [part='category'] {
    font-size: 0.75rem;
    color: var(--_ss-muted);
  }

  [part='status'] {
    padding: var(--_ss-space-sm);
    font-size: var(--_ss-font-sm);
    color: var(--_ss-muted);
    text-align: center;
  }

  [part='status'][data-error='true'] {
    color: var(--_ss-danger);
  }

  @media (forced-colors: active) {
    [part='combobox'],
    [part='popup'] {
      background: Canvas;
      color: CanvasText;
      border-color: CanvasText;
    }

    [part='option'][data-active='true'],
    [part='option'][aria-selected='true'] {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
