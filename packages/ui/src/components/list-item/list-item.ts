import { devWarn, UIElement, type PropertyValues } from '@methane/core';
import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { listItemMessages } from './list-item.messages.js';
import { listItemStyles } from './list-item.styles.js';

function isSafeHref(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^(\/|\.\/|\.\.\/|\?|#)/.test(trimmed)) return true;
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed);
  if (!schemeMatch) {
    return !trimmed.startsWith('//');
  }
  const scheme = schemeMatch[1]!.toLowerCase();
  return scheme === 'https' || scheme === 'http' || scheme === 'mailto' || scheme === 'tel';
}

/**
 * `<mth-list-item>`: semantic list row item for `<mth-list>`.
 */
export class MthListItem extends UIElement {
  static override messages = listItemMessages;
  static override styles = listItemStyles;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: String })
  description = '';

  @property({ type: Boolean, reflect: true })
  selected = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  interactive = false;

  @property({ type: String, reflect: true })
  href = '';

  @state()
  private hasDescriptionSlot = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.internals) {
      this.internals.role = 'listitem';
    }
    const reflectedRole = (this as HTMLElement & { role?: string | null }).role;
    if (reflectedRole !== 'listitem' && !this.hasAttribute('role')) {
      this.setAttribute('role', 'listitem');
    }
    this.syncStates();
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (
      changedProperties.has('selected') ||
      changedProperties.has('disabled') ||
      changedProperties.has('interactive')
    ) {
      this.syncStates();
    }
  }

  private syncStates(): void {
    this.setCustomState('selected', this.selected);
    this.setCustomState('disabled', this.disabled);
    this.setCustomState('interactive', this.interactive);
    if (this.internals) {
      this.internals.ariaSelected = this.selected ? 'true' : null;
      this.internals.ariaDisabled = this.disabled ? 'true' : null;
    }
  }

  private resolveSafeHref(): string | undefined {
    if (this.disabled) return undefined;
    const raw = this.href.trim();
    if (!raw) return undefined;
    if (!isSafeHref(raw)) {
      devWarn(`<mth-list-item> rejected unsafe href "${raw}".`);
      return undefined;
    }
    return raw;
  }

  private readonly handleDescriptionSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    this.hasDescriptionSlot = slot
      .assignedNodes({ flatten: true })
      .some((n) => n.nodeType === Node.ELEMENT_NODE || (n.textContent?.trim().length ?? 0) > 0);
  };

  override render() {
    const safeHref = this.resolveSafeHref();
    const showDescription = this.description.trim().length > 0 || this.hasDescriptionSlot;

    return html`
      <div part="base" class="base">
        <span part="prefix" class="prefix">
          <slot name="prefix"></slot>
        </span>
        <div part="content" class="content">
          <div part="title" class="title">
            ${safeHref
              ? html`<a part="link" class="link" href=${safeHref}><slot></slot></a>`
              : html`<slot></slot>`}
          </div>
          <div part="description" class="description" ?hidden=${!showDescription}>
            <slot name="description" @slotchange=${this.handleDescriptionSlotChange}>
              ${this.description}
            </slot>
          </div>
        </div>
        <span part="suffix" class="suffix">
          <slot name="suffix"></slot>
        </span>
      </div>
    `;
  }
}
