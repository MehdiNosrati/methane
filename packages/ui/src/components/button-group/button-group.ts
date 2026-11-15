import { UIElement, type PropertyValues } from '@methane/core';
import { RovingFocusController, SlotCollectionController } from '@methane/primitives';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { buttonGroupMessages } from './button-group.messages.js';
import { buttonGroupStyles } from './button-group.styles.js';

export type MthButtonGroupOrientation = 'horizontal' | 'vertical';
export type MthButtonGroupRoleMode = 'group' | 'toolbar';

function isGroupFocusableButton(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'button' || tag === 'mth-button' || tag === 'mth-icon-button') return true;
  if (tag === 'a' && el.hasAttribute('href')) return true;
  const role = el.getAttribute('role');
  return role === 'button' || role === 'link';
}

/**
 * `<mth-button-group>`: semantic `group` / `toolbar` container with optional
 * attached borders and RTL-aware `RovingFocusController` single-tabstop navigation.
 */
export class MthButtonGroup extends UIElement {
  static override messages = buttonGroupMessages;
  static override styles = buttonGroupStyles;

  @property({ type: String, reflect: true })
  orientation: MthButtonGroupOrientation = 'horizontal';

  @property({ type: Boolean, reflect: true })
  attached = false;

  @property({ type: Boolean, reflect: true })
  roving = false;

  @property({ type: String, reflect: true, attribute: 'role-mode' })
  roleMode: MthButtonGroupRoleMode = 'group';

  @property({ type: String })
  label = '';

  private readonly slotCtrl: SlotCollectionController<HTMLElement>;
  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    this.slotCtrl = new SlotCollectionController<HTMLElement>(this, {
      filter: isGroupFocusableButton,
      attributeFilter: ['disabled', 'aria-disabled'],
      onItemsChange: () => {
        if (this.isRovingActive) {
          this.rovingCtrl.syncTabIndices();
        }
      },
    });
    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () => (this.isRovingActive ? this.slotCtrl.slottedElements : []),
      orientation: 'horizontal',
      loop: true,
    });
  }

  private get isRovingActive(): boolean {
    return this.roving || this.roleMode === 'toolbar';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncSemantics();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncSemantics();
    this.rovingCtrl.updateOptions({
      orientation: this.orientation,
      loop: true,
    });
  }

  private syncSemantics(): void {
    this.setCustomState('attached', this.attached);
    this.setCustomState('vertical', this.orientation === 'vertical');
    this.setCustomState('roving', this.isRovingActive);
    if (this.internals) {
      this.internals.role = this.roleMode === 'toolbar' ? 'toolbar' : 'group';
      this.internals.ariaLabel = this.label.trim() || null;
      this.internals.ariaOrientation = this.orientation;
    }
  }

  /** Returns the currently collected interactive buttons in DOM order. */
  getItems(): ReadonlyArray<HTMLElement> {
    return this.slotCtrl.slottedElements;
  }

  override render() {
    return html`<div part="base"><slot></slot></div>`;
  }
}
