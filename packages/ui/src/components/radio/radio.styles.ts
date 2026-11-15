import { css } from 'lit';

export const radioStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    outline: none;
    --_radio-bg: var(--mth-color-surface, Canvas);
    --_radio-fg: var(--mth-color-fg, CanvasText);
    --_radio-border: var(--mth-color-border-strong, ButtonBorder);
    --_radio-accent: var(--mth-color-accent, Highlight);
    --_radio-focus: var(--mth-color-border-focus, Highlight);
  }

  :host(:focus-visible) .control {
    outline: 2px solid var(--_radio-focus);
    outline-offset: 2px;
  }

  :host(:state(disabled)) {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .base {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .control {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.125rem;
    block-size: 1.125rem;
    border-radius: var(--mth-radius-full, 9999px);
    border: 1.5px solid var(--_radio-border);
    background: var(--_radio-bg);
    box-sizing: border-box;
  }

  :host(:state(checked)) .control {
    border-color: var(--_radio-accent);
  }

  .indicator {
    inline-size: 0.5625rem;
    block-size: 0.5625rem;
    border-radius: var(--mth-radius-full, 9999px);
    background: transparent;
  }

  :host(:state(checked)) .indicator {
    background: var(--_radio-accent);
  }

  .label {
    color: var(--_radio-fg);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  @media (forced-colors: active) {
    .control {
      background: Canvas;
      border-color: ButtonBorder;
    }

    :host(:state(checked)) .control {
      border-color: Highlight;
    }

    :host(:state(checked)) .indicator {
      background: Highlight;
    }

    :host(:focus-visible) .control {
      outline: 2px solid Highlight;
    }

    :host(:state(disabled)) {
      opacity: 1;
      color: GrayText;
    }

    :host(:state(disabled)) .control {
      border-color: GrayText;
    }
  }
`;
