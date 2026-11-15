import { UIElement } from '@methane-ui/core';
import { html, nothing, svg, type SVGTemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { iconMessages } from './icon.messages.js';
import { iconStyles } from './icon.styles.js';

export type MthIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type MthIconName =
  | 'check'
  | 'close'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-up'
  | 'search'
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'external'
  | 'menu'
  | 'plus'
  | 'minus'
  | 'user'
  | 'copy'
  | 'share';

export const ICON_CATALOG: Readonly<Record<MthIconName, () => SVGTemplateResult>> = {
  check: () => svg`<path d="M5 10.5l3.5 3.5 6.5-7.5"></path>`,
  close: () => svg`<path d="M6 6l8 8"></path><path d="M14 6l-8 8"></path>`,
  'chevron-down': () => svg`<path d="M5 7.5l5 5 5-5"></path>`,
  'chevron-right': () => svg`<path d="M7.5 5l5 5-5 5"></path>`,
  'chevron-left': () => svg`<path d="M12.5 5l-5 5 5 5"></path>`,
  'chevron-up': () => svg`<path d="M5 12.5l5-5 5 5"></path>`,
  search: () => svg`<circle cx="9" cy="9" r="5.5"></circle><path d="M13 13l4 4"></path>`,
  info: () =>
    svg`<circle cx="10" cy="10" r="7.5"></circle><path d="M10 9v4.5"></path><circle cx="10" cy="6.2" r="0.6"></circle>`,
  warning: () =>
    svg`<path d="M10 3L2.5 16.5h15L10 3z"></path><path d="M10 8v4"></path><circle cx="10" cy="14.5" r="0.6"></circle>`,
  error: () =>
    svg`<circle cx="10" cy="10" r="7.5"></circle><path d="M7.5 7.5l5 5"></path><path d="M12.5 7.5l-5 5"></path>`,
  success: () =>
    svg`<circle cx="10" cy="10" r="7.5"></circle><path d="M6.5 10.2l2.3 2.3 4.7-4.8"></path>`,
  external: () =>
    svg`<path d="M11 4h5v5"></path><path d="M9 11l7-7"></path><path d="M15 11v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4"></path>`,
  menu: () => svg`<path d="M3.5 5.5h13"></path><path d="M3.5 10h13"></path><path d="M3.5 14.5h13"></path>`,
  plus: () => svg`<path d="M10 4.5v11"></path><path d="M4.5 10h11"></path>`,
  minus: () => svg`<path d="M4.5 10h11"></path>`,
  user: () =>
    svg`<circle cx="10" cy="7" r="3.2"></circle><path d="M4.5 16.5a5.5 5.5 0 0 1 11 0"></path>`,
  copy: () =>
    svg`<rect x="7.5" y="7.5" width="9" height="9" rx="1.5"></rect><path d="M4.5 12.5H4a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 4 2.5h7A1.5 1.5 0 0 1 12.5 4v.5"></path>`,
  share: () =>
    svg`<circle cx="14.5" cy="5" r="2"></circle><circle cx="5.5" cy="10" r="2"></circle><circle cx="14.5" cy="15" r="2"></circle><path d="M7.3 9l5.4-3"></path><path d="M7.3 11l5.4 3"></path>`,
};

/**
 * `<mth-icon>`: built-in semantic vector icon catalog rendered safely with Lit
 * `svg` templates and `<slot>` fallback.
 */
export class MthIcon extends UIElement {
  static override messages = iconMessages;
  static override styles = iconStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String, reflect: true })
  size: MthIconSize = 'md';

  @property({ type: String })
  label = '';

  override render() {
    const trimmedLabel = this.label.trim();
    const isLabeled = trimmedLabel.length > 0;
    const renderGlyph =
      this.name in ICON_CATALOG ? ICON_CATALOG[this.name as MthIconName] : undefined;

    return html`
      <span
        part="base"
        class="base"
        data-size=${this.size}
        role=${isLabeled ? 'img' : nothing}
        aria-label=${isLabeled ? trimmedLabel : nothing}
        aria-hidden=${isLabeled ? nothing : 'true'}
      >
        ${renderGlyph
          ? svg`<svg part="svg" class="svg" viewBox="0 0 20 20" aria-hidden="true">${renderGlyph()}</svg>`
          : html`<slot></slot>`}
      </span>
    `;
  }
}
