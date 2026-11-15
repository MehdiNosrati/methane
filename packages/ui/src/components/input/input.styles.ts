import { css } from 'lit';

export const inputStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_input-bg: var(--mth-color-surface, Canvas);
    --_input-fg: var(--mth-color-fg, CanvasText);
    --_input-muted: var(--mth-color-fg-muted, GrayText);
    --_input-border: var(--mth-color-border, ButtonBorder);
    --_input-focus: var(--mth-color-border-focus, Highlight);
    --_input-danger: var(--mth-color-danger, crimson);
    --_input-radius: var(--mth-radius-md, 0.375rem);
    --_input-pad-inline: calc(var(--mth-space-control-inline, 0.75rem) * var(--mth-density, 1));
    --_input-pad-block: calc(var(--mth-space-control-block, 0.5rem) * var(--mth-density, 1));
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
    color: var(--_input-fg);
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
    padding-inline: var(--_input-pad-inline);
    padding-block: var(--_input-pad-block);
    background: var(--_input-bg);
    color: var(--_input-fg);
    border: 1px solid var(--_input-border);
    border-radius: var(--_input-radius);
  }

  .wrapper:focus-within {
    border-color: var(--_input-focus);
    outline: 2px solid var(--_input-focus);
    outline-offset: 1px;
  }

  :host(:state(user-invalid)) .wrapper,
  .wrapper[data-invalid='true'] {
    border-color: var(--_input-danger);
  }

  :host(:state(disabled)) .wrapper {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .control,
  ::slotted(input) {
    flex: 1 1 auto;
    min-inline-size: 0;
    inline-size: 100%;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    outline: none;
    padding-block: 0;
    padding-inline: 0;
  }

  .hint {
    margin-block: 0;
    color: var(--_input-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_input-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @media (forced-colors: active) {
    .wrapper {
      background: Field;
      color: FieldText;
      border-color: ButtonBorder;
    }

    .wrapper:focus-within {
      outline: 2px solid Highlight;
      border-color: Highlight;
    }

    :host(:state(disabled)) .wrapper {
      opacity: 1;
      color: GrayText;
      border-color: GrayText;
    }
  }
`;
