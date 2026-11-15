import { css } from 'lit';

export const progressRingStyles = css`
  :host {
    --_track: var(--mth-color-border, oklch(88% 0.01 260));
    --_indicator: var(--mth-color-accent, oklch(52% 0.2 255));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_ring-size: 48px;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--_fg);
  }

  .base {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--_ring-size);
    block-size: var(--_ring-size);
  }

  svg {
    inline-size: 100%;
    block-size: 100%;
    transform: rotate(-90deg);
  }

  :host([indeterminate]) svg {
    animation: mth-ring-spin 1.2s linear infinite;
  }

  .track {
    fill: none;
    stroke: var(--_track);
  }

  .indicator {
    fill: none;
    stroke: var(--_indicator);
    stroke-linecap: round;
    transition: stroke-dashoffset var(--mth-motion-duration-fast, 120ms) linear;
  }

  .label {
    position: absolute;
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: 1;
  }

  @keyframes mth-ring-spin {
    to {
      transform: rotate(270deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host([indeterminate]) svg,
    .indicator {
      animation: none;
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .track {
      stroke: GrayText;
    }

    .indicator {
      stroke: Highlight;
    }
  }
`;
