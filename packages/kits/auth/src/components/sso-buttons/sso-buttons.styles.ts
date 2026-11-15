import { css } from 'lit';

export const ssoButtonsStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_sso-bg: var(--mth-color-surface, light-dark(oklch(99% 0 0), oklch(16% 0.01 260)));
    --_sso-bg-hover: var(--mth-color-bg-subtle, light-dark(oklch(96% 0.005 260), oklch(22% 0.01 260)));
    --_sso-fg: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
    --_sso-border: var(--mth-color-border, light-dark(oklch(86% 0.01 260), oklch(34% 0.01 260)));
    --_sso-focus: var(--mth-color-border-focus, light-dark(oklch(55% 0.18 255), oklch(72% 0.16 255)));
    --_sso-radius: var(--mth-radius-md, 0.5rem);
  }

  :host([hidden]) {
    display: none;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  :host([orientation='horizontal']) .list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .provider-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px solid var(--_sso-border);
    border-radius: var(--_sso-radius);
    background-color: var(--_sso-bg);
    color: var(--_sso-fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
  }

  .provider-btn:hover:not(:disabled) {
    background-color: var(--_sso-bg-hover);
  }

  .provider-btn:focus-visible {
    outline: 2px solid var(--_sso-focus);
    outline-offset: 2px;
  }

  .provider-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (forced-colors: active) {
    .provider-btn {
      border-color: ButtonText;
      background-color: Canvas;
      color: ButtonText;
    }

    .provider-btn:focus-visible {
      outline: 2px solid Highlight;
    }

    .provider-btn:disabled {
      border-color: GrayText;
      color: GrayText;
    }
  }
`;
