import { UIElement, type PropertyValues, html, property } from '@methane/core';
import { resizablePanelMessages } from './resizable-panel.messages.js';
import { resizablePanelStyles } from './resizable-panel.styles.js';

/**
 * Resizable panel container coordinated by `<mth-resizable-group>`.
 */
export class MthResizablePanel extends UIElement {
  static override styles = resizablePanelStyles;
  static override messages = resizablePanelMessages;

  @property({ type: Number, attribute: 'default-size' })
  defaultSize = 50;

  @property({ type: Number })
  size = 50;

  @property({ type: Number, attribute: 'min-size' })
  minSize = 10;

  @property({ type: Number, attribute: 'max-size' })
  maxSize = 100;

  @property({ type: Boolean, reflect: true })
  collapsible = false;

  @property({ type: Boolean, reflect: true })
  collapsed = false;

  private dynamicSheet: CSSStyleSheet | null = null;

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('collapsed')) {
      this.setCustomState('collapsed', this.collapsed);
    }
    this.syncDynamicBasis();
  }

  /**
   * Collapses the panel if `collapsible` is enabled.
   */
  collapse(): void {
    if (!this.collapsible || this.collapsed) return;
    this.collapsed = true;
    this.emitEvent('mth-collapse', { detail: { collapsed: true } });
  }

  /**
   * Expands the panel from collapsed state.
   */
  expand(): void {
    if (!this.collapsed) return;
    this.collapsed = false;
    this.emitEvent('mth-collapse', { detail: { collapsed: false } });
  }

  private syncDynamicBasis(): void {
    if (
      typeof CSSStyleSheet === 'undefined' ||
      !this.shadowRoot ||
      !('adoptedStyleSheets' in this.shadowRoot)
    ) {
      return;
    }
    if (!this.dynamicSheet) {
      this.dynamicSheet = new CSSStyleSheet();
      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        this.dynamicSheet,
      ];
    }
    const effective = this.collapsed
      ? 0
      : Math.min(this.maxSize, Math.max(this.minSize, Number.isFinite(this.size) ? this.size : 50));
    this.dynamicSheet.replaceSync(`:host { flex: 0 0 ${effective}%; }`);
  }

  override render() {
    return html`<div part="base"><slot></slot></div>`;
  }
}
