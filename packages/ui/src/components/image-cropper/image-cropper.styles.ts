import { css } from 'lit';

export const imageCropperStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans);
    color: var(--mth-color-fg);
  }

  .base {
    display: grid;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--mth-color-surface);
  }

  :host(:state(disabled)) .base {
    opacity: 0.6;
  }

  .viewport {
    position: relative;
    overflow: hidden;
    inline-size: 100%;
    block-size: 14rem;
    display: grid;
    place-items: center;
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--mth-color-bg-subtle, var(--mth-color-surface));
    touch-action: none;
  }

  .image {
    max-inline-size: 100%;
    max-block-size: 100%;
    object-fit: contain;
    user-select: none;
    transform-origin: center;
  }

  .frame {
    position: absolute;
    inset-block: 10%;
    inset-inline: 10%;
    border: 2px dashed var(--mth-color-accent);
    pointer-events: none;
  }

  .controls {
    display: grid;
    gap: var(--mth-space-2, 0.5rem);
  }

  .slider-row {
    display: grid;
    grid-template-columns: 8rem 1fr;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .actions {
    display: flex;
    gap: var(--mth-space-2, 0.5rem);
  }

  .action-btn {
    cursor: pointer;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border: 1px solid var(--mth-color-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--mth-color-bg-subtle, var(--mth-color-surface));
    color: var(--mth-color-fg);
  }

  @media (forced-colors: active) {
    .base,
    .viewport,
    .action-btn {
      border-color: ButtonText;
    }

    .frame {
      border-color: Highlight;
    }
  }
`;
