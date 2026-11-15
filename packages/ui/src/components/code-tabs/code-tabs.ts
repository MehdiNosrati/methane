import { UIElement } from '@methane/core';
import {
  ClipboardAndShare,
  LiveAnnouncer,
  RovingFocusController,
  SlotCollectionController,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { codeTabsMessages } from './code-tabs.messages.js';
import { codeTabsStyles } from './code-tabs.styles.js';

export interface CodeTabItem {
  value: string;
  label: string;
  code: string;
  language?: string;
}

function isSlottedCodeItem(el: Element): el is HTMLElement {
  return typeof HTMLElement !== 'undefined'
    && el instanceof HTMLElement
    && (el.hasAttribute('label') || el.hasAttribute('data-label'));
}

/**
 * Accessible code tab switcher (`<mth-code-tabs>`) supporting slotted or
 * programmatic code tabs, single-tabstop roving keyboard focus, and one-click
 * clipboard copying.
 */
export class MthCodeTabs extends UIElement {
  static override messages = codeTabsMessages;
  static override styles = codeTabsStyles;
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: String })
  label = '';

  @property({ attribute: false })
  tabs: ReadonlyArray<CodeTabItem> | null = null;

  @property({ type: Boolean, attribute: 'show-copy', reflect: true })
  showCopy = true;

  @state()
  private slottedTabs: ReadonlyArray<CodeTabItem> = [];

  @state()
  private copied = false;

  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly slotCollection = new SlotCollectionController<HTMLElement>(this, {
    filter: isSlottedCodeItem,
    attributeFilter: ['label', 'data-label', 'value', 'language'],
    onItemsChange: () => {
      this.syncSlottedTabs();
    },
  });

  private readonly rovingFocus = new RovingFocusController(this, {
    getItems: () => this.getTabs(),
    orientation: 'horizontal',
    loop: true,
    onActiveChange: (_item, index) => {
      const items = this.getResolvedItems();
      const target = items[index];
      if (!target) return;
      if (target.value !== this.getEffectiveValue(items)) {
        this.value = target.value;
        this.copied = false;
        this.emitChange(target.value);
      }
    },
  });

  /** Returns the interactive `[role="tab"]` triggers inside shadow DOM. */
  getTabs(): ReadonlyArray<HTMLElement> {
    if (!this.shadowRoot) return [];
    return Array.from(this.shadowRoot.querySelectorAll<HTMLElement>('[role="tab"]'));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof window !== 'undefined' && (this.children?.length ?? 0) > 0) {
      this.syncSlottedTabs();
    }
  }

  override disconnectedCallback(): void {
    if (this.copyResetTimer !== null) {
      clearTimeout(this.copyResetTimer);
      this.copyResetTimer = null;
    }
    super.disconnectedCallback();
  }

  private syncSlottedTabs(): void {
    const rawChildren = Array.from(this.children ?? []).filter(isSlottedCodeItem);
    const items = rawChildren.length > 0 ? rawChildren : this.slotCollection.items;
    this.slottedTabs = items.map((el, index) => {
      const itemLabel =
        el.getAttribute('label') ??
        el.getAttribute('data-label') ??
        this.t('tabLabel', { index: index + 1 });
      const itemValue = el.getAttribute('value') ?? itemLabel.toLowerCase().replaceAll(/\s+/g, '-');
      const language = el.getAttribute('language') ?? undefined;
      const code = (el.textContent ?? '').replace(/^\n+|\n+$/g, '');
      return {
        value: itemValue,
        label: itemLabel,
        code,
        ...(language !== undefined ? { language } : {}),
      };
    });
  }

  private getResolvedItems(): ReadonlyArray<CodeTabItem> {
    if (this.tabs && this.tabs.length > 0) {
      return this.tabs;
    }
    return this.slottedTabs;
  }

  private getEffectiveValue(items: ReadonlyArray<CodeTabItem>): string {
    if (items.length === 0) return '';
    if (this.value && items.some((item) => item.value === this.value)) {
      return this.value;
    }
    return items[0]!.value;
  }

  private emitChange(nextValue: string): void {
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('mth-change', {
        detail: { value: nextValue },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleTabClick(index: number): void {
    const items = this.getResolvedItems();
    const target = items[index];
    if (!target) return;

    const prevValue = this.getEffectiveValue(items);
    this.rovingFocus.setActiveIndex(index, true);
    if (this.value !== target.value) {
      this.value = target.value;
      this.copied = false;
      if (prevValue !== target.value) {
        this.emitChange(target.value);
      }
    }
  }

  private async handleCopyClick(): Promise<void> {
    const items = this.getResolvedItems();
    const activeValue = this.getEffectiveValue(items);
    const activeItem = items.find((item) => item.value === activeValue) ?? items[0];
    if (!activeItem) return;

    const result = await ClipboardAndShare.copyText(activeItem.code);
    this.copied = result.ok;

    if (this.copyResetTimer !== null) {
      clearTimeout(this.copyResetTimer);
      this.copyResetTimer = null;
    }
    if (result.ok) {
      this.copyResetTimer = setTimeout(() => {
        this.copied = false;
        this.copyResetTimer = null;
      }, 2000);
      LiveAnnouncer.announce(this.t('copiedAnnouncement'), 'polite');
    } else {
      LiveAnnouncer.announce(this.t('copyFailedAnnouncement'), 'polite');
    }

    this.dispatchEvent(
      new CustomEvent<{ value: string; code: string; ok: boolean }>('mth-copy', {
        detail: { value: activeItem.value, code: activeItem.code, ok: result.ok },
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected override render() {
    const items = this.getResolvedItems();
    const activeValue = this.getEffectiveValue(items);
    const activeIndex = Math.max(0, items.findIndex((item) => item.value === activeValue));
    const activeItem = items[activeIndex] ?? null;
    const tablistLabel = this.label || this.t('tablistLabel');

    return html`
      <div part="base">
        <div part="header">
          <div
            part="tablist"
            role="tablist"
            aria-label=${tablistLabel}
            aria-orientation="horizontal"
          >
            ${items.map((item, index) => {
              const selected = index === activeIndex;
              return html`
                <button
                  part="tab"
                  type="button"
                  role="tab"
                  id=${`mth-ct-tab-${index}`}
                  aria-selected=${selected ? 'true' : 'false'}
                  aria-controls="mth-ct-panel"
                  tabindex=${selected ? 0 : -1}
                  @click=${() => this.handleTabClick(index)}
                >
                  ${item.label}
                </button>
              `;
            })}
          </div>
          ${this.showCopy && activeItem
            ? html`
                <button
                  part="copy-button"
                  type="button"
                  aria-label=${this.copied ? this.t('copiedLabel') : this.t('copyLabel')}
                  @click=${() => void this.handleCopyClick()}
                >
                  ${this.copied ? this.t('copiedLabel') : this.t('copyLabel')}
                </button>
              `
            : nothing}
        </div>
        <div
          part="panel"
          id="mth-ct-panel"
          role="tabpanel"
          aria-labelledby=${activeItem ? `mth-ct-tab-${activeIndex}` : nothing}
        >
          ${activeItem
            ? html`<pre><code part="code" data-language=${activeItem.language ?? nothing}>${activeItem.code}</code></pre>`
            : html`<pre><code part="code">${this.t('emptyLabel')}</code></pre>`}
        </div>
        <div class="mth-code-tabs__slot" hidden>
          <slot @slotchange=${() => this.syncSlottedTabs()}></slot>
        </div>
      </div>
    `;
  }
}
