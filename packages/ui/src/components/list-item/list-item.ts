import { IS_DEV, devWarn, UIElement, type PropertyValues } from '@methane-ui/core';
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
    const initialRole = this.getAttribute('role') === 'option' ? 'option' : 'listitem';
    if (this.internals) {
      this.internals.role = initialRole;
    }
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', initialRole);
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
    const isOption = this.getAttribute('role') === 'option';
    if (this.internals) {
      this.internals.role = isOption ? 'option' : 'listitem';
      this.internals.ariaSelected = isOption ? (this.selected ? 'true' : 'false') : null;
      this.internals.ariaDisabled = this.disabled ? 'true' : null;
    }
  }

  private resolveSafeHref(): string | undefined {
    if (this.disabled) return undefined;
    const raw = this.href.trim();
    if (!raw) return undefined;
    if (!isSafeHref(raw)) {
      if (IS_DEV) {
        devWarn(`<mth-list-item> rejected unsafe href "${raw}".`);
      }
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
