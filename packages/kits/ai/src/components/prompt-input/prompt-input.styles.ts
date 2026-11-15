import { css } from 'lit';

export const promptInputStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_pi-bg: var(--mth-color-surface, light-dark(oklch(99% 0 0), oklch(16% 0.01 260)));
    --_pi-fg: var(--mth-color-fg, light-dark(oklch(18% 0.01 260), oklch(94% 0.01 260)));
    --_pi-muted: var(--mth-color-fg-muted, light-dark(oklch(48% 0.01 260), oklch(72% 0.01 260)));
    --_pi-border: var(--mth-color-border, light-dark(oklch(86% 0.01 260), oklch(34% 0.01 260)));
    --_pi-border-focus: var(--mth-color-border-focus, light-dark(oklch(55% 0.18 255), oklch(72% 0.16 255)));
    --_pi-danger: var(--mth-color-danger, light-dark(oklch(55% 0.22 25), oklch(68% 0.19 25)));
    --_pi-radius: var(--mth-radius-lg, 0.75rem);
    --_pi-block-size: auto;
  }

  :host([hidden]) {
    display: none;
  }

  .container {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .label {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    color: var(--_pi-fg);
  }

  .composer {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--_pi-border);
    border-radius: var(--_pi-radius);
    background-color: var(--_pi-bg);
    color: var(--_pi-fg);
  }

  .composer:focus-within {
    border-color: var(--_pi-border-focus);
    outline: 2px solid var(--_pi-border-focus);
    outline-offset: -1px;
  }

  :host(:state(invalid)) .composer {
    border-color: var(--_pi-danger);
  }

  :host(:state(disabled)) .composer {
    opacity: 0.6;
  }

  .textarea {
    inline-size: 100%;
    block-size: var(--_pi-block-size, auto);
    min-block-size: 2.5rem;
    max-block-size: 16rem;
    padding: 0;
    border: 0;
    margin: 0;
    resize: none;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: var(--mth-line-height-normal, 1.5);
    outline: none;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  .start-slots,
  .end-slots {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .hint {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_pi-muted);
    margin: 0;
  }

  .error {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_pi-danger);
    margin: 0;
  }

  @media (forced-colors: active) {
    .composer {
      border-color: CanvasText;
      background-color: Canvas;
      color: CanvasText;
    }

    .composer:focus-within {
      outline: 2px solid Highlight;
      border-color: Highlight;
    }

    :host(:state(invalid)) .composer {
      border-color: Mark;
    }

    :host(:state(disabled)) .composer {
      border-color: GrayText;
      color: GrayText;
    }
  }
`;
