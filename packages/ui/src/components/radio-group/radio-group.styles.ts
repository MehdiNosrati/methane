import { css } from 'lit';

export const radioGroupStyles = css`
  :host {
    display: block;
    --_rg-fg: var(--mth-color-fg, CanvasText);
    --_rg-muted: var(--mth-color-fg-muted, GrayText);
    --_rg-danger: var(--mth-color-danger, oklch(0.57 0.22 25));
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .label {
    display: inline-flex;
    align-items: baseline;
    gap: var(--mth-space-1, 0.25rem);
    color: var(--_rg-fg);
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .required-mark {
    color: var(--_rg-danger);
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding-block: 0;
    padding-inline: 0;
    margin-block: -1px;
    margin-inline: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border-width: 0;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .group[data-orientation='horizontal'] {
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--mth-space-4, 1rem);
  }

  .hint {
    margin-block: 0;
    color: var(--_rg-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_rg-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @media (forced-colors: active) {
    .label {
      color: CanvasText;
    }

    .hint {
      color: GrayText;
    }

    .error,
    .required-mark {
      color: LinkText;
    }
  }
`;
