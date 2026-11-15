import { css } from '@methane-ui/core';

export const locationPickerStyles = css`
  :host {
    display: block;
    inline-size: 100%;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2);
    background: var(--mth-color-surface);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md);
    padding-block: var(--mth-space-3);
    padding-inline: var(--mth-space-3);
  }

  .label {
    font-size: var(--mth-font-size-sm);
    font-weight: var(--mth-font-weight-medium);
    color: var(--mth-color-fg);
  }

  .viewport {
    position: relative;
    min-block-size: 11rem;
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm);
    background: var(--mth-color-bg-subtle);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-block: var(--mth-space-2);
    padding-inline: var(--mth-space-2);
  }

  .canvas {
    position: absolute;
    inset: 0;
  }

  .pin-target {
    position: relative;
    z-index: 2;
    padding-block: var(--mth-space-2);
    padding-inline: var(--mth-space-3);
    border: 2px solid var(--mth-color-accent);
    border-radius: var(--mth-radius-full);
    background: var(--mth-color-surface-raised);
    color: var(--mth-color-fg);
    font-family: var(--mth-font-mono);
    font-size: var(--mth-font-size-xs);
    cursor: pointer;
  }

  .pin-target:focus-visible,
  .action-btn:focus-visible {
    outline: 2px solid var(--mth-color-border-focus);
    outline-offset: 2px;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2);
  }

  .nudge-group {
    display: inline-flex;
    gap: var(--mth-space-1);
  }

  .action-btn {
    padding-block: var(--mth-space-1);
    padding-inline: var(--mth-space-2);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-xs);
    background: var(--mth-color-surface-raised);
    color: var(--mth-color-fg);
    font-size: var(--mth-font-size-xs);
    cursor: pointer;
  }

  .action-btn:disabled,
  .pin-target:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    font-size: var(--mth-font-size-xs);
    color: var(--mth-color-danger);
  }

  @media (forced-colors: active) {
    .pin-target,
    .action-btn {
      forced-color-adjust: none;
    }
  }
`;
