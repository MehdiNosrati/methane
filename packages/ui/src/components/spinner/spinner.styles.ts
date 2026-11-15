import { css } from 'lit';

export const spinnerStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    box-sizing: border-box;
    --_spinner-size: 1.5rem;
    --_spinner-track: var(--mth-color-border, ButtonBorder);
    --_spinner-color: var(--mth-color-accent, Highlight);
  }

  .base[data-size='xs'] {
    --_spinner-size: 0.875rem;
  }

  .base[data-size='sm'] {
    --_spinner-size: 1.125rem;
  }

  .base[data-size='lg'] {
    --_spinner-size: 2.25rem;
  }

  .base {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--_spinner-size);
    block-size: var(--_spinner-size);
  }

  .indicator {
    inline-size: 100%;
    block-size: 100%;
    animation: mth-spinner-rotate 0.8s linear infinite;
  }

  .track {
    fill: none;
    stroke: var(--_spinner-track);
    stroke-width: 3;
  }

  .arc {
    fill: none;
    stroke: var(--_spinner-color);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 42 100;
  }

  @keyframes mth-spinner-rotate {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .indicator {
      animation: none;
    }
  }

  @media (forced-colors: active) {
    .track {
      stroke: ButtonBorder;
    }

    .arc {
      stroke: Highlight;
    }
  }
`;
