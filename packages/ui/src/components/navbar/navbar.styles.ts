import { css } from 'lit';

export const navbarStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    --_nav-bg: var(--mth-color-surface, Canvas);
    --_nav-fg: var(--mth-color-fg, CanvasText);
    --_nav-border: var(--mth-color-border, oklch(0.91 0.009 255));
    --_nav-z: var(--mth-z-index-sticky, 200);
  }

  :host([sticky]),
  :host(:state(sticky)) {
    position: sticky;
    inset-block-start: 0;
    z-index: var(--_nav-z);
  }

  [part='base'] {
    background-color: var(--_nav-bg);
    color: var(--_nav-fg);
    border-block-end: 1px solid var(--_nav-border);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  [part='inner'] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-4, 1rem);
    min-block-size: 3.5rem;
    padding-inline: var(--mth-space-4, 1rem);
  }

  [part='brand'] {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    flex-shrink: 0;
  }

  [part='nav'] {
    display: none;
    align-items: center;
    gap: var(--mth-space-3, 0.75rem);
    flex: 1 1 auto;
    min-inline-size: 0;
  }

  [part='actions'] {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    margin-inline-start: auto;
  }

  [part='toggle'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2.25rem;
    block-size: 2.25rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--mth-color-border-strong, oklch(0.84 0.011 255));
    border-radius: var(--mth-radius-md, 0.375rem);
    background-color: var(--_nav-bg);
    color: var(--_nav-fg);
    cursor: pointer;
  }

  [part='toggle']:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 2px;
  }

  [part='drawer'] {
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-4, 1rem);
    border-block-start: 1px solid var(--_nav-border);
    background-color: var(--_nav-bg);
  }

  [part='drawer'][hidden] {
    display: none;
  }

  @media (width >= 48rem) {
    [part='nav'] {
      display: flex;
    }

    [part='toggle'],
    [part='drawer'] {
      display: none;
    }
  }

  @media (forced-colors: active) {
    [part='base'] {
      border-block-end-color: CanvasText;
    }

    [part='toggle'] {
      background-color: ButtonFace;
      color: ButtonText;
      border-color: ButtonBorder;
    }
  }
`;
