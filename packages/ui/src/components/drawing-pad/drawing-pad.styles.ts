import { css } from 'lit';

export const drawingPadStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
  }

  .base {
    display: grid;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface);
  }

  :host(:state(disabled)) .base {
    opacity: 0.6;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .tool-button,
  .action-button {
    cursor: pointer;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--mth-color-bg-subtle, var(--mth-color-surface));
    color: var(--mth-color-fg);
  }

  .tool-button[aria-pressed='true'] {
    background: var(--mth-color-accent);
    color: var(--mth-color-accent-fg);
    border-color: var(--mth-color-accent);
  }

  .width-label {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .canvas {
    display: block;
    inline-size: 100%;
    block-size: 14rem;
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--mth-color-surface);
    touch-action: none;
    cursor: crosshair;
  }

  :host(:state(disabled)) .canvas {
    cursor: not-allowed;
  }

  @media (forced-colors: active) {
    .base,
    .tool-button,
    .action-button,
    .canvas {
      border-color: ButtonText;
    }

    .tool-button[aria-pressed='true'] {
      background: Highlight;
      color: HighlightText;
    }
  }
`;
