import { css } from 'lit';

export const suggestionChipsStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_sc-bg: var(--mth-color-surface, light-dark(oklch(99% 0 0), oklch(16% 0.01 260)));
    --_sc-bg-hover: var(--mth-color-accent-subtle, light-dark(oklch(95% 0.03 255), oklch(26% 0.05 255)));
    --_sc-fg: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
    --_sc-border: var(--mth-color-border, light-dark(oklch(86% 0.01 260), oklch(34% 0.01 260)));
    --_sc-accent: var(--mth-color-accent, light-dark(oklch(52% 0.2 255), oklch(70% 0.16 255)));
    --_sc-focus: var(--mth-color-border-focus, light-dark(oklch(55% 0.18 255), oklch(72% 0.16 255)));
    --_sc-radius: var(--mth-radius-full, 9999px);
  }

  :host([hidden]) {
    display: none;
  }

  .list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  :host([orientation='vertical']) .list {
    flex-direction: column;
    align-items: flex-start;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_sc-border);
    border-radius: var(--_sc-radius);
    background-color: var(--_sc-bg);
    color: var(--_sc-fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    text-align: start;
    cursor: pointer;
  }

  .chip:hover:not(:disabled) {
    background-color: var(--_sc-bg-hover);
    border-color: var(--_sc-accent);
  }

  .chip:focus-visible {
    outline: 2px solid var(--_sc-focus);
    outline-offset: 2px;
  }

  .chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (forced-colors: active) {
    .chip {
      border-color: ButtonText;
      background-color: Canvas;
      color: ButtonText;
    }

    .chip:hover:not(:disabled) {
      border-color: Highlight;
    }

    .chip:focus-visible {
      outline: 2px solid Highlight;
    }

    .chip:disabled {
      border-color: GrayText;
      color: GrayText;
    }
  }
`;
