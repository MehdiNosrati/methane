import { css } from 'lit';

export const maskedInputStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_mask-bg: var(--mth-color-surface, Canvas);
    --_mask-fg: var(--mth-color-fg, CanvasText);
    --_mask-muted: var(--mth-color-fg-muted, GrayText);
    --_mask-border: var(--mth-color-border, ButtonBorder);
    --_mask-focus: var(--mth-color-border-focus, Highlight);
    --_mask-danger: var(--mth-color-danger, crimson);
    --_mask-radius: var(--mth-radius-md, 0.375rem);
    --_mask-pad-inline: calc(var(--mth-space-control-inline, 0.75rem) * var(--mth-density, 1));
    --_mask-pad-block: calc(var(--mth-space-control-block, 0.5rem) * var(--mth-density, 1));
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .label {
    display: inline-flex;
    align-items: baseline;
    gap: var(--mth-space-1, 0.25rem);
    color: var(--_mask-fg);
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding-block: 0;
    padding-inline: 0;
    margin-block: -1px;
    margin-inline: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border-width: 0;
  }

  .wrapper {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-inline: var(--_mask-pad-inline);
    padding-block: var(--_mask-pad-block);
    background: var(--_mask-bg);
    color: var(--_mask-fg);
    border: 1px solid var(--_mask-border);
    border-radius: var(--_mask-radius);
  }

  .wrapper:focus-within {
    border-color: var(--_mask-focus);
    outline: 2px solid var(--_mask-focus);
    outline-offset: 1px;
  }

  :host(:state(user-invalid)) .wrapper,
  .wrapper[data-invalid='true'] {
    border-color: var(--_mask-danger);
  }

  :host(:state(disabled)) .wrapper {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .control {
    flex: 1 1 auto;
    min-inline-size: 0;
    inline-size: 100%;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    outline: none;
    padding-block: 0;
    padding-inline: 0;
  }

  .hint {
    margin-block: 0;
    color: var(--_mask-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_mask-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @media (forced-colors: active) {
    .wrapper {
      border-color: ButtonBorder;
    }

    .wrapper:focus-within {
      outline-color: Highlight;
      border-color: Highlight;
    }
  }
`;
