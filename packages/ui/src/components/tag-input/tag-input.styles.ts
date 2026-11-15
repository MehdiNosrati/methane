import { css } from 'lit';

export const tagInputStyles = css`
  :host {
    display: block;
    font-family: inherit;
    color: var(--mth-color-fg, light-dark(oklch(0.208 0.042 266), oklch(0.984 0.003 248)));
  }

  :host([disabled]) {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: 500;
  }

  .control {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    min-block-size: 2.375rem;
    padding-block: 0.25rem;
    padding-inline: 0.5rem;
    border-radius: 0.375rem;
    border: 1px solid var(--mth-tag-input-border, var(--mth-color-border, light-dark(oklch(0.869 0.022 253), oklch(0.372 0.044 257))));
    background-color: var(--mth-tag-input-bg, var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.208 0.042 266))));
    box-sizing: border-box;
  }

  .control:focus-within {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 255));
    outline-offset: 1px;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding-block: 0.125rem;
    padding-inline: 0.5rem 0.25rem;
    border-radius: 9999px;
    font-size: var(--mth-font-size-xs, 0.75rem);
    background-color: var(
      --mth-tag-input-chip-bg,
      var(--mth-color-accent-subtle, light-dark(oklch(0.97 0.014 255), oklch(0.379 0.146 266)))
    );
  }

  .tag-remove {
    appearance: none;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    padding: 0 0.125rem;
    line-height: 1;
    border-radius: 9999px;
  }

  .tag-remove:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 255));
  }

  .input {
    flex: 1 1 6rem;
    min-inline-size: 4rem;
    border: none;
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    padding-block: 0.1875rem;
    outline: none;
  }

  .hint {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, light-dark(oklch(0.446 0.043 257), oklch(0.704 0.04 257)));
  }

  .error {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-danger, oklch(0.58 0.22 27));
  }

  @media (forced-colors: active) {
    .control {
      border: 1px solid CanvasText;
      background-color: Canvas;
    }

    .tag {
      border: 1px solid ButtonText;
    }
  }
`;
