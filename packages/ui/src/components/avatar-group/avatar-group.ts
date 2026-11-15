import { UIElement, type PropertyValues } from '@methane-ui/core';
import { SlotCollectionController } from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { avatarGroupMessages } from './avatar-group.messages.js';
import { avatarGroupStyles } from './avatar-group.styles.js';

export type MthAvatarGroupSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * `<mth-avatar-group>`: stacks slotted avatar elements using `SlotCollectionController`,
 * hiding overflow items beyond `max` and displaying a localized `+N` overflow badge.
 */
export class MthAvatarGroup extends UIElement {
  static override messages = avatarGroupMessages;
  static override styles = avatarGroupStyles;

  @property({ type: Number })
  max = 0;

  @property({ type: String, reflect: true })
  size: MthAvatarGroupSize = 'md';

  @property({ type: String })
  label = '';

  @state()
  private overflowCount = 0;

  private readonly slotCtrl: SlotCollectionController<HTMLElement>;

  constructor() {
    super();
    this.slotCtrl = new SlotCollectionController<HTMLElement>(this, {
      filter: (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        (el.localName.endsWith('avatar') || el.tagName.toLowerCase().includes('avatar')),
      onItemsChange: () => {
        this.syncAvatars();
      },
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncAvatars();
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('max') || changedProperties.has('size')) {
      this.syncAvatars();
    }
  }

  private syncAvatars(): void {
    const items = this.slotCtrl.items;
    const limit =
      Number.isFinite(this.max) && this.max > 0 ? Math.floor(this.max) : items.length;
    const nextOverflow = Math.max(0, items.length - limit);

    for (let i = 0; i < items.length; i += 1) {
      const avatar = items[i] as HTMLElement & { size?: string };
      const shouldHide = i >= limit;
      if (avatar.hidden !== shouldHide) {
        avatar.hidden = shouldHide;
      }
      if (this.hasAttribute('size') && avatar.size !== this.size) {
        avatar.size = this.size;
      }
    }

    if (this.overflowCount !== nextOverflow) {
      this.overflowCount = nextOverflow;
    }
    this.setCustomState('overflowing', nextOverflow > 0);
  }

  override render() {
    const groupLabel = this.label.trim().length > 0 ? this.label : this.t('groupLabel');
    const hasOverflow = this.overflowCount > 0;

    return html`
      <div
        part="base"
        class="base"
        role="group"
        aria-label=${groupLabel}
        data-size=${this.size}
      >
        <slot></slot>
        <span
          part="overflow"
          class="overflow"
          role=${hasOverflow ? 'img' : nothing}
          aria-label=${hasOverflow ? this.t('moreAvatars', { count: this.overflowCount }) : nothing}
          ?hidden=${!hasOverflow}
        >
          ${hasOverflow ? this.t('overflowCount', { count: this.overflowCount }) : nothing}
        </span>
      </div>
    `;
  }
}
