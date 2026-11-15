import { css } from 'lit';

export const avatarGroupStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_group-overlap: -0.5rem;
    --_group-ring: var(--mth-color-surface, Canvas);
    --_overflow-bg: var(--mth-color-bg-subtle, oklch(0.92 0.008 255));
    --_overflow-fg: var(--mth-color-fg, CanvasText);
    --_overflow-border: var(--mth-color-border, ButtonBorder);
    --_overflow-size: 2.5rem;
    --_overflow-font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .base[data-size='xs'] {
    --_group-overlap: -0.35rem;
    --_overflow-size: 1.5rem;
  }

  .base[data-size='sm'] {
    --_group-overlap: -0.4rem;
    --_overflow-size: 2rem;
  }

  .base[data-size='lg'] {
    --_group-overlap: -0.625rem;
    --_overflow-size: 3rem;
    --_overflow-font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .base[data-size='xl'] {
    --_group-overlap: -0.75rem;
    --_overflow-size: 4rem;
    --_overflow-font-size: var(--mth-font-size-md, 1rem);
  }

  .base {
    display: inline-flex;
    align-items: center;
  }

  ::slotted(*) {
    margin-inline-start: var(--_group-overlap);
    border-radius: var(--mth-radius-full, 9999px);
    box-shadow: 0 0 0 2px var(--_group-ring);
  }

  ::slotted(:first-child) {
    margin-inline-start: 0;
  }

  ::slotted([hidden]) {
    display: none;
  }

  .overflow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-inline-start: var(--_group-overlap);
    inline-size: var(--_overflow-size);
    block-size: var(--_overflow-size);
    border-radius: var(--mth-radius-full, 9999px);
    background-color: var(--_overflow-bg);
    color: var(--_overflow-fg);
    border: 1px solid var(--_overflow-border);
    box-shadow: 0 0 0 2px var(--_group-ring);
    font-size: var(--_overflow-font-size);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: 1;
    user-select: none;
  }

  .overflow[hidden] {
    display: none;
  }

  @media (forced-colors: active) {
    .overflow {
      background-color: Canvas;
      color: CanvasText;
      border: 1px solid ButtonBorder;
    }
  }
`;
