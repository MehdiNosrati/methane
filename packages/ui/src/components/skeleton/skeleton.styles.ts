import { css } from 'lit';

export const skeletonStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    --_skeleton-bg: var(--mth-color-bg-subtle, oklch(0.92 0.006 255));
    --_skeleton-highlight: var(--mth-color-surface, oklch(0.98 0.002 255));
    --_skeleton-width: var(--mth-skeleton-width, 100%);
    --_skeleton-height: var(--mth-skeleton-height, 1rem);
    --_skeleton-radius: var(--mth-radius-sm, 0.25rem);
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    inline-size: var(--_skeleton-width);
  }

  .line {
    display: block;
    inline-size: 100%;
    block-size: var(--_skeleton-height);
    border-radius: var(--_skeleton-radius);
    background-color: var(--_skeleton-bg);
  }

  .base[data-variant='text'][data-multiline='true'] .line:last-child {
    inline-size: 75%;
  }

  .base[data-variant='circular'] {
    --_skeleton-width: var(--mth-skeleton-width, 2.5rem);
    --_skeleton-height: var(--mth-skeleton-height, 2.5rem);
  }

  .base[data-variant='circular'] .line {
    inline-size: var(--_skeleton-width);
    block-size: var(--_skeleton-height);
    border-radius: var(--mth-radius-full, 9999px);
  }

  .base[data-variant='rectangular'] {
    --_skeleton-height: var(--mth-skeleton-height, 6rem);
  }

  .base[data-variant='rectangular'] .line {
    block-size: var(--_skeleton-height);
    border-radius: var(--mth-radius-md, 0.375rem);
  }

  .base[data-animated='true'] .line {
    background-image: linear-gradient(
      90deg,
      var(--_skeleton-bg) 0%,
      var(--_skeleton-highlight) 50%,
      var(--_skeleton-bg) 100%
    );
    background-size: 200% 100%;
    animation: mth-skeleton-shimmer 1.5s ease-in-out infinite;
  }

  @keyframes mth-skeleton-shimmer {
    0% {
      background-position: 200% 0;
    }

    100% {
      background-position: -200% 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .base[data-animated='true'] .line {
      animation: none;
      background-image: none;
    }
  }

  @media (forced-colors: active) {
    .line {
      background-color: Canvas;
      background-image: none;
      border: 1px solid GrayText;
    }
  }
`;
