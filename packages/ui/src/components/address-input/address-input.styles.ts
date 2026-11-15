import { css } from 'lit';

export const addressInputStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_addr-bg: var(--mth-color-surface, Canvas);
    --_addr-fg: var(--mth-color-fg, CanvasText);
    --_addr-muted: var(--mth-color-fg-muted, GrayText);
    --_addr-border: var(--mth-color-border, ButtonBorder);
    --_addr-focus: var(--mth-color-border-focus, Highlight);
    --_addr-danger: var(--mth-color-danger, crimson);
    --_addr-radius: var(--mth-radius-md, 0.375rem);
    --_addr-pad-inline: calc(var(--mth-space-control-inline, 0.75rem) * var(--mth-density, 1));
    --_addr-pad-block: calc(var(--mth-space-control-block, 0.5rem) * var(--mth-density, 1));
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
    color: var(--_addr-fg);
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

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--mth-space-2, 0.5rem);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .field-full {
    grid-column: 1 / -1;
  }

  .sub-label {
    color: var(--_addr-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .control {
    inline-size: 100%;
    box-sizing: border-box;
    padding-inline: var(--_addr-pad-inline);
    padding-block: var(--_addr-pad-block);
    background: var(--_addr-bg);
    color: var(--_addr-fg);
    border: 1px solid var(--_addr-border);
    border-radius: var(--_addr-radius);
    font: inherit;
    outline: none;
  }

  .control:focus-visible {
    border-color: var(--_addr-focus);
    outline: 2px solid var(--_addr-focus);
    outline-offset: 1px;
  }

  :host(:state(user-invalid)) .control,
  .grid[data-invalid='true'] .control {
    border-color: var(--_addr-danger);
  }

  :host(:state(disabled)) .control {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .hint {
    margin-block: 0;
    color: var(--_addr-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_addr-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @container (max-inline-size: 24rem) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (forced-colors: active) {
    .control {
      border-color: ButtonBorder;
    }

    .control:focus-visible {
      outline-color: Highlight;
      border-color: Highlight;
    }
  }
`;
