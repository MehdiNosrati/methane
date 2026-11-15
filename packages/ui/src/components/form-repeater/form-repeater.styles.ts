import { css } from 'lit';

export const formRepeaterStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_rep-bg: var(--mth-color-surface, Canvas);
    --_rep-fg: var(--mth-color-fg, CanvasText);
    --_rep-muted: var(--mth-color-fg-muted, GrayText);
    --_rep-subtle: var(--mth-color-bg-subtle, Field);
    --_rep-border: var(--mth-color-border, ButtonBorder);
    --_rep-focus: var(--mth-color-border-focus, Highlight);
    --_rep-danger: var(--mth-color-danger, crimson);
    --_rep-radius: var(--mth-radius-md, 0.375rem);
    --_rep-pad-inline: calc(var(--mth-space-control-inline, 0.75rem) * var(--mth-density, 1));
    --_rep-pad-block: calc(var(--mth-space-control-block, 0.5rem) * var(--mth-density, 1));
  }

  .fieldset {
    border: none;
    margin-block: 0;
    margin-inline: 0;
    padding-block: 0;
    padding-inline: 0;
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .legend {
    display: inline-flex;
    align-items: baseline;
    gap: var(--mth-space-1, 0.25rem);
    padding-inline: 0;
    color: var(--_rep-fg);
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
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

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    background: var(--_rep-bg);
    border: 1px solid var(--_rep-border);
    border-radius: var(--_rep-radius);
  }

  .fields {
    display: flex;
    flex: 1 1 12rem;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  .field {
    display: flex;
    flex: 1 1 8rem;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .sub-label {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_rep-muted);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .control {
    inline-size: 100%;
    box-sizing: border-box;
    padding-inline: var(--_rep-pad-inline);
    padding-block: var(--_rep-pad-block);
    border: 1px solid var(--_rep-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--_rep-bg);
    color: var(--_rep-fg);
    font: inherit;
    outline: none;
  }

  .row-controls {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
  }

  .icon-btn,
  .add-btn {
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--_rep-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--_rep-subtle);
    color: var(--_rep-fg);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .add-btn {
    align-self: flex-start;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .control:focus-visible,
  .icon-btn:focus-visible,
  .add-btn:focus-visible {
    outline: 2px solid var(--_rep-focus);
    outline-offset: 1px;
  }

  .icon-btn:disabled,
  .add-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .hint {
    margin-block: 0;
    color: var(--_rep-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_rep-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @media (forced-colors: active) {
    .row,
    .control,
    .icon-btn,
    .add-btn {
      border-color: ButtonBorder;
    }

    .control:focus-visible,
    .icon-btn:focus-visible,
    .add-btn:focus-visible {
      outline-color: Highlight;
    }
  }
`;
