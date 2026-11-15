import { css } from 'lit';

export const facetFiltersStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--mth-color-fg, light-dark(oklch(0.21 0.01 260), oklch(0.96 0.005 260)));
  }

  .root {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-3, 0.75rem);
    padding: var(--mth-space-4, 1rem);
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.88 0.008 260), oklch(0.35 0.015 260)));
    border-radius: var(--mth-radius-lg, 0.75rem);
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.19 0.01 260)));
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .heading {
    margin: 0;
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
  }

  .clear-btn {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--mth-color-accent, oklch(0.55 0.22 260));
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-medium, 500);
    cursor: pointer;
    padding: var(--mth-space-1, 0.25rem);
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    padding-block-start: var(--mth-space-3, 0.75rem);
    border-block-start: 1px solid var(--mth-color-border, light-dark(oklch(0.9 0.006 260), oklch(0.32 0.012 260)));
  }

  .group-toggle {
    appearance: none;
    border: none;
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    display: flex;
    align-items: center;
    justify-content: space-between;
    inline-size: 100%;
    padding: 0;
    cursor: pointer;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  .swatch {
    appearance: none;
    inline-size: 1.75rem;
    block-size: 1.75rem;
    border-radius: var(--mth-radius-full, 9999px);
    border: 2px solid var(--mth-color-border, light-dark(oklch(0.84 0.008 260), oklch(0.4 0.015 260)));
    background-color: var(--_ff-swatch, var(--mth-color-bg-subtle, oklch(0.85 0.01 260)));
    cursor: pointer;
  }

  .swatch[aria-pressed='true'] {
    outline: 2px solid var(--mth-color-accent, oklch(0.55 0.22 260));
    outline-offset: 2px;
  }

  .range-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--mth-space-2, 0.5rem);
  }

  .range-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .range-input {
    border: 1px solid var(--mth-color-border, light-dark(oklch(0.84 0.008 260), oklch(0.38 0.015 260)));
    border-radius: var(--mth-radius-sm, 0.375rem);
    background-color: var(--mth-color-surface, light-dark(oklch(1 0 0), oklch(0.2 0.01 260)));
    color: inherit;
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-1, 0.25rem);
  }

  .check-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .clear-btn:focus-visible,
  .group-toggle:focus-visible,
  .swatch:focus-visible,
  .range-input:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.22 260));
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    .root,
    .range-input {
      border: 1px solid CanvasText;
    }

    .swatch[aria-pressed='true'] {
      outline: 2px solid Highlight;
    }
  }
`;
