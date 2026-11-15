import { css } from 'lit';

export const commandPaletteStyles = css`
  :host {
    display: contents;
    --_cp-surface: var(--mth-color-surface, oklch(1 0 0));
    --_cp-subtle: var(--mth-color-bg-subtle, oklch(0.97 0.005 260));
    --_cp-text: var(--mth-color-fg, oklch(0.2 0.02 260));
    --_cp-muted: var(--mth-color-fg-muted, oklch(0.52 0.02 260));
    --_cp-border: var(--mth-color-border, oklch(0.86 0.01 260));
    --_cp-primary: var(--mth-color-accent, oklch(0.55 0.18 260));
    --_cp-backdrop: var(--mth-color-backdrop, oklch(0.15 0.02 260 / 0.45));
    --_cp-radius-lg: var(--mth-radius-lg, 0.75rem);
    --_cp-radius-md: var(--mth-radius-md, 0.375rem);
    --_cp-space-sm: var(--mth-space-2, 0.5rem);
    --_cp-space-md: var(--mth-space-3, 0.75rem);
    --_cp-shadow: var(--mth-shadow-lg, 0 20px 50px oklch(0.1 0.02 260 / 0.2));
    --_cp-font-md: var(--mth-font-size-md, 1rem);
    --_cp-font-sm: var(--mth-font-size-sm, 0.875rem);
    --_cp-z: var(--mth-z-index-modal, 1000);
  }

  [part='dialog'] {
    box-sizing: border-box;
    inline-size: min(36rem, calc(100vw - 2rem));
    max-block-size: min(30rem, calc(100vh - 4rem));
    padding: 0;
    margin: auto;
    border: 1px solid var(--_cp-border);
    border-radius: var(--_cp-radius-lg);
    background: var(--_cp-surface);
    color: var(--_cp-text);
    box-shadow: var(--_cp-shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  [part='dialog'][hidden] {
    display: none;
  }

  [part='dialog'][data-mth-fallback-open='true'] {
    position: fixed;
    inset-block-start: 12vh;
    inset-inline: 0;
    z-index: var(--_cp-z);
  }

  [part='dialog']::backdrop {
    background: var(--_cp-backdrop);
  }

  [part='header'] {
    display: flex;
    align-items: center;
    gap: var(--_cp-space-sm);
    padding-inline: var(--_cp-space-md);
    padding-block: var(--_cp-space-sm);
    border-block-end: 1px solid var(--_cp-border);
  }

  [part='input'] {
    flex: 1 1 auto;
    inline-size: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: var(--_cp-text);
    font-size: var(--_cp-font-md);
    padding-block: 0.375rem;
  }

  [part='listbox'] {
    flex: 1 1 auto;
    overflow-block: auto;
    padding: var(--_cp-space-sm);
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  [part='group-label'] {
    font-size: var(--_cp-font-sm);
    font-weight: 600;
    color: var(--_cp-muted);
    padding-inline: var(--_cp-space-sm);
    padding-block: 0.25rem;
  }

  [part='option'] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--_cp-space-sm);
    padding-inline: var(--_cp-space-sm);
    padding-block: 0.5rem;
    border-radius: var(--_cp-radius-md);
    font-size: var(--_cp-font-sm);
    cursor: pointer;
    user-select: none;
  }

  [part='option']:hover:not([aria-disabled='true']),
  [part='option'][data-active='true'],
  [part='option'][aria-selected='true'] {
    background: var(--_cp-subtle);
  }

  [part='option'][data-active='true'] {
    outline: 2px solid var(--_cp-primary);
    outline-offset: -2px;
  }

  [part='option'][aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  [part='shortcut'] {
    font-size: 0.75rem;
    color: var(--_cp-muted);
    border: 1px solid var(--_cp-border);
    border-radius: var(--_cp-radius-md);
    padding-inline: 0.375rem;
    padding-block: 0.125rem;
  }

  [part='empty'] {
    padding: var(--_cp-space-md);
    text-align: center;
    color: var(--_cp-muted);
    font-size: var(--_cp-font-sm);
  }

  [part='footer'] {
    border-block-start: 1px solid var(--_cp-border);
    padding-inline: var(--_cp-space-md);
    padding-block: 0.375rem;
    font-size: 0.75rem;
    color: var(--_cp-muted);
  }

  @media (forced-colors: active) {
    [part='dialog'] {
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
