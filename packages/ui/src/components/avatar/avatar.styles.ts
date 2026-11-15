import { css } from 'lit';

export const avatarStyles = css`
  :host {
    display: inline-flex;
    position: relative;
    vertical-align: middle;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_avatar-size: var(--mth-avatar-size, 2.5rem);
    --_avatar-bg: var(--mth-color-bg-subtle, oklch(0.92 0.008 255));
    --_avatar-fg: var(--mth-color-fg, CanvasText);
    --_avatar-border: var(--mth-color-border, ButtonBorder);
    --_avatar-ring: var(--mth-color-surface, Canvas);
    --_avatar-font-size: var(--mth-font-size-sm, 0.875rem);
    --_avatar-status-size: 0.625rem;
  }

  .base[data-size='xs'] {
    --_avatar-size: var(--mth-avatar-size, 1.5rem);
    --_avatar-font-size: var(--mth-font-size-xs, 0.75rem);
    --_avatar-status-size: 0.4375rem;
  }

  .base[data-size='sm'] {
    --_avatar-size: var(--mth-avatar-size, 2rem);
    --_avatar-font-size: var(--mth-font-size-xs, 0.75rem);
    --_avatar-status-size: 0.5rem;
  }

  .base[data-size='lg'] {
    --_avatar-size: var(--mth-avatar-size, 3rem);
    --_avatar-font-size: var(--mth-font-size-md, 1rem);
    --_avatar-status-size: 0.75rem;
  }

  .base[data-size='xl'] {
    --_avatar-size: var(--mth-avatar-size, 4rem);
    --_avatar-font-size: var(--mth-font-size-lg, 1.125rem);
    --_avatar-status-size: 0.875rem;
  }

  .base {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--_avatar-size);
    block-size: var(--_avatar-size);
    border-radius: var(--mth-radius-full, 9999px);
    background-color: var(--_avatar-bg);
    color: var(--_avatar-fg);
    border: 1px solid var(--_avatar-border);
    font-size: var(--_avatar-font-size);
    font-weight: var(--mth-font-weight-semibold, 600);
    user-select: none;
  }

  .base[data-shape='square'] {
    border-radius: var(--mth-radius-md, 0.375rem);
  }

  .frame {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 100%;
    block-size: 100%;
    border-radius: inherit;
    overflow: hidden;
  }

  .image {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    display: block;
  }

  .initials {
    line-height: 1;
    text-transform: uppercase;
  }

  .fallback-svg {
    inline-size: 60%;
    block-size: 60%;
    fill: none;
    stroke: currentcolor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .status {
    position: absolute;
    inset-block-end: 0;
    inset-inline-end: 0;
    inline-size: var(--_avatar-status-size);
    block-size: var(--_avatar-status-size);
    border-radius: var(--mth-radius-full, 9999px);
    border: 2px solid var(--_avatar-ring);
    background-color: var(--mth-color-fg-subtle, GrayText);
  }

  .status[data-status='online'] {
    background-color: var(--mth-color-success, oklch(0.6 0.17 150));
  }

  .status[data-status='busy'] {
    background-color: var(--mth-color-danger, oklch(0.57 0.22 25));
  }

  .status[data-status='away'] {
    background-color: var(--mth-color-warning, oklch(0.75 0.17 75));
  }

  .status[data-status='offline'] {
    background-color: var(--mth-color-fg-subtle, GrayText);
  }

  @media (forced-colors: active) {
    .base {
      background-color: Canvas;
      color: CanvasText;
      border: 1px solid ButtonBorder;
    }

    .status {
      border-color: Canvas;
      background-color: Highlight;
    }
  }
`;
