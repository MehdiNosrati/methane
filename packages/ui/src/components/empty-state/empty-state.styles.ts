import { css } from 'lit';

export const emptyStateStyles = css`
  :host {
    display: block;
    --_empty-bg: var(--mth-color-surface, Canvas);
    --_empty-fg: var(--mth-color-fg, CanvasText);
    --_empty-muted: var(--mth-color-fg-muted, GrayText);
    --_empty-border: var(--mth-color-border, ButtonBorder);
    --_empty-icon-bg: var(--mth-color-bg-subtle, oklch(0.95 0.008 255));
    --_empty-icon-fg: var(--mth-color-fg-muted, GrayText);
    --_empty-radius: var(--mth-radius-lg, 0.75rem);
    --_empty-pad-block: calc(var(--mth-space-8, 2rem) * var(--mth-density, 1));
    --_empty-pad-inline: calc(var(--mth-space-6, 1.5rem) * var(--mth-density, 1));
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    color: var(--_empty-fg);
  }

  :host([variant='compact']) {
    --_empty-pad-block: calc(var(--mth-space-4, 1rem) * var(--mth-density, 1));
    --_empty-pad-inline: calc(var(--mth-space-4, 1rem) * var(--mth-density, 1));
  }

  :host([tone='info']) {
    --_empty-icon-bg: var(--mth-color-info-subtle, oklch(0.94 0.04 250));
    --_empty-icon-fg: var(--mth-color-info, oklch(0.5 0.16 250));
  }

  :host([tone='warning']) {
    --_empty-icon-bg: var(--mth-color-warning-subtle, oklch(0.95 0.05 85));
    --_empty-icon-fg: var(--mth-color-warning, oklch(0.58 0.16 70));
  }

  :host([tone='danger']) {
    --_empty-icon-bg: var(--mth-color-danger-subtle, oklch(0.94 0.05 25));
    --_empty-icon-fg: var(--mth-color-danger, oklch(0.55 0.2 25));
  }

  .base {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--_empty-pad-block);
    padding-inline: var(--_empty-pad-inline);
    box-sizing: border-box;
  }

  :host([align='start']) .base {
    align-items: flex-start;
    text-align: start;
  }

  :host([variant='card']) .base {
    background: var(--_empty-bg);
    border: 1px solid var(--_empty-border);
    border-radius: var(--_empty-radius);
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 3rem;
    block-size: 3rem;
    border-radius: var(--mth-radius-full, 9999px);
    background: var(--_empty-icon-bg);
    color: var(--_empty-icon-fg);
  }

  .title {
    margin-block: 0;
    margin-inline: 0;
    font-size: var(--mth-font-size-lg, 1.125rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
    color: var(--_empty-fg);
  }

  .title[hidden],
  .description[hidden] {
    display: none;
  }

  .description {
    margin-block: 0;
    margin-inline: 0;
    max-inline-size: 36rem;
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
    color: var(--_empty-muted);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
    margin-block-start: var(--mth-space-1, 0.25rem);
  }

  @media (forced-colors: active) {
    :host([variant='card']) .base,
    .icon {
      border: 1px solid CanvasText;
    }
  }
`;
