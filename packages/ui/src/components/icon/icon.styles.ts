import { css } from 'lit';

export const iconStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    box-sizing: border-box;
    --_icon-size: var(--mth-icon-size, 1.25rem);
    --_icon-color: var(--mth-icon-color, currentcolor);
  }

  .base[data-size='xs'] {
    --_icon-size: var(--mth-icon-size, 0.75rem);
  }

  .base[data-size='sm'] {
    --_icon-size: var(--mth-icon-size, 1rem);
  }

  .base[data-size='lg'] {
    --_icon-size: var(--mth-icon-size, 1.5rem);
  }

  .base[data-size='xl'] {
    --_icon-size: var(--mth-icon-size, 2rem);
  }

  .base {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--_icon-size);
    block-size: var(--_icon-size);
    color: var(--_icon-color);
    line-height: 1;
  }

  .svg,
  ::slotted(svg) {
    inline-size: 100%;
    block-size: 100%;
    fill: none;
    stroke: currentcolor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  @media (forced-colors: active) {
    .base {
      color: CanvasText;
    }
  }
`;
