import { css } from 'lit';

export const videoPlayerStyles = css`
  :host {
    display: block;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.2 0.02 250), oklch(0.92 0.01 250)));
  }

  .base {
    position: relative;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.82 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-video-radius, var(--mth-radius-md, 0.5rem));
    background: var(--mth-color-neutral-950, oklch(0.12 0.01 250));
    overflow: hidden;
  }

  .video {
    display: block;
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 16 / 9;
    background: var(--mth-color-neutral-950, oklch(0.12 0.01 250));
  }

  .invalid {
    display: grid;
    place-items: center;
    aspect-ratio: 16 / 9;
    padding: var(--mth-space-4, 1rem);
    color: var(--mth-color-neutral-200, oklch(0.88 0.01 250));
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    background: var(--mth-color-surface, light-dark(oklch(0.98 0.005 250), oklch(0.18 0.01 250)));
    color: var(--mth-color-fg, light-dark(oklch(0.2 0.02 250), oklch(0.92 0.01 250)));
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2rem;
    min-block-size: 2rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.82 0.01 250), oklch(0.35 0.01 250)));
    border-radius: var(--mth-radius-sm, 0.375rem);
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .seek {
    flex: 1 1 8rem;
    min-inline-size: 4rem;
  }

  .volume {
    inline-size: 4.5rem;
  }

  .time {
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-xs, 0.75rem);
    white-space: nowrap;
  }

  .btn:focus-visible,
  .seek:focus-visible,
  .volume:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, light-dark(oklch(0.55 0.2 255), oklch(0.72 0.18 255)));
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .base,
    .btn {
      border-color: ButtonText;
    }
  }
`;
