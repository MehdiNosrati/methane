import { css } from 'lit';

export const keyValueStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_kv-label-fg: var(--mth-color-fg-muted, GrayText);
    --_kv-value-fg: var(--mth-color-fg, CanvasText);
    --_kv-gap: var(--mth-space-2, 0.5rem);
    --_kv-border: var(--mth-color-border, ButtonBorder);
    --_kv-focus-ring: var(--mth-color-border-focus, Highlight);
  }

  .base {
    display: grid;
    grid-template-columns: minmax(8rem, auto) minmax(0, 1fr);
    align-items: baseline;
    column-gap: var(--mth-space-4, 1rem);
    row-gap: var(--mth-space-1, 0.25rem);
    margin-block: 0;
    margin-inline: 0;
  }

  :host([orientation='vertical']) .base {
    grid-template-columns: minmax(0, 1fr);
  }

  .label {
    margin-block: 0;
    margin-inline: 0;
    color: var(--_kv-label-fg);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .value-row {
    display: flex;
    align-items: center;
    gap: var(--_kv-gap);
    margin-block: 0;
    margin-inline: 0;
    min-inline-size: 0;
    color: var(--_kv-value-fg);
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .value-text {
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }

  :host([monospace]) .value-text {
    font-family: var(--mth-font-mono, ui-monospace, monospace);
  }

  .copy {
    appearance: none;
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    background-color: var(--mth-color-surface, Canvas);
    color: var(--_kv-label-fg);
    border: 1px solid var(--_kv-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    padding-block: 0.125rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
    flex-shrink: 0;
  }

  .copy:hover {
    color: var(--_kv-value-fg);
  }

  .copy:focus-visible {
    outline: 2px solid var(--_kv-focus-ring);
    outline-offset: 1px;
  }

  .copy-icon {
    inline-size: 0.875em;
    block-size: 0.875em;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  @media (forced-colors: active) {
    .copy {
      background-color: ButtonFace;
      color: ButtonText;
      border-color: ButtonBorder;
    }
  }
`;
