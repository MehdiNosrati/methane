import { UIElement, type PropertyValues } from '@methane/core';
import { RovingFocusController } from '@methane/primitives';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { settingsShellMessages } from './settings-shell.messages.js';
import { settingsShellStyles } from './settings-shell.styles.js';

export interface SettingsSectionItem {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
}

/**
 * `<mth-settings-shell>`: Settings workspace with navigation rail and dirty-state save bar.
 */
export class MthSettingsShell extends UIElement {
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = settingsShellMessages;
  static override styles = settingsShellStyles;

  @property({ attribute: false })
  sections: ReadonlyArray<SettingsSectionItem> = [];

  @property({ type: String, reflect: true, attribute: 'active-section-id' })
  activeSectionId = '';

  @property({ type: Boolean, reflect: true })
  dirty = false;

  @property({ type: Boolean, reflect: true })
  saving = false;

  private readonly rovingFocus: RovingFocusController;

  constructor() {
    super();
    this.rovingFocus = new RovingFocusController(this, {
      orientation: 'vertical',
      loop: true,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []),
    });
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.rovingFocus.updateOptions({ dir: this.resolvedDir });
    if (changed.has('sections') && !this.activeSectionId && this.sections[0]) {
      this.activeSectionId = this.sections[0].id;
    }
    this.setCustomState('dirty', this.dirty);
    this.setCustomState('saving', this.saving);
  }

  selectSection(id: string): void {
    const target = this.sections.find((s) => s.id === id);
    if (!target || target.disabled || target.id === this.activeSectionId) return;
    this.activeSectionId = id;
    this.emitEvent('mth-section-change', { detail: { id } });
  }

  override render() {
    const activeSection = this.sections.find((s) => s.id === this.activeSectionId);

    return html`
      <div
        part="base"
        class="base"
        role="region"
        aria-label=${this.t('regionLabel')}
        dir=${this.resolvedDir}
      >
        <div
          part="nav"
          class="nav"
          role="tablist"
          aria-orientation="vertical"
          aria-label=${this.t('navLabel')}
        >
          ${this.sections.map((section) => {
            const selected = section.id === this.activeSectionId;
            return html`
              <button
                type="button"
                part="nav-item"
                class="nav-item"
                role="tab"
                aria-selected=${selected ? 'true' : 'false'}
                ?disabled=${Boolean(section.disabled)}
                @click=${() => this.selectSection(section.id)}
              >
                ${section.label}
              </button>
            `;
          })}
        </div>

        <div class="main">
          <div part="content" class="content" role="tabpanel">
            <slot name="header"></slot>
            <h2 class="section-title" ?hidden=${!activeSection}>
              ${activeSection?.label ?? ''}
            </h2>
            <slot></slot>
          </div>

          <div part="save-bar" class="save-bar" ?hidden=${!this.dirty}>
            <span role="status">
              ${this.saving ? this.t('savingLabel') : this.t('dirtyMessage')}
            </span>
            <div class="save-actions">
              <button
                type="button"
                class="action-btn"
                ?disabled=${this.saving}
                @click=${() =>
                  this.emitEvent('mth-discard', {
                    detail: { activeSectionId: this.activeSectionId },
                  })}
              >
                ${this.t('discardLabel')}
              </button>
              <button
                type="button"
                class="action-btn"
                data-primary="true"
                ?disabled=${this.saving}
                @click=${() =>
                  this.emitEvent('mth-save', {
                    detail: { activeSectionId: this.activeSectionId },
                  })}
              >
                ${this.t('saveLabel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
