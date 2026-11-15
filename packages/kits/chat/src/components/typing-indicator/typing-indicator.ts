import { UIElement, type PropertyValues } from '@methane-ui/core';
import { MotionController } from '@methane-ui/primitives';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { resolveEffectiveDir } from '../../shared/dir.js';
import { typingIndicatorMessages } from './typing-indicator.messages.js';
import { typingIndicatorStyles } from './typing-indicator.styles.js';

/**
 * `<mth-typing-indicator>`: localized typing status indicator with `Intl.PluralRules`
 * formatting via `this.t(...)` and `MotionController` reduced-motion handling.
 */
export class MthTypingIndicator extends UIElement {
  static override messages = typingIndicatorMessages;
  static override styles = typingIndicatorStyles;

  @property({ attribute: false })
  users: ReadonlyArray<string> = [];

  @property({ type: String })
  label = '';

  @property({ type: String })
  locale = '';

  private readonly motionCtrl: MotionController;

  constructor() {
    super();
    this.motionCtrl = new MotionController(this);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncStates();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('users') || changed.has('label')) {
      this.syncStates();
    }
  }

  private getSanitizedUsers(): ReadonlyArray<string> {
    return (this.users ?? []).map((u) => String(u).trim()).filter(Boolean);
  }

  private syncStates(): void {
    const active = this.getSanitizedUsers().length > 0 || this.label.trim().length > 0;
    this.setCustomState('active', active);
    this.setCustomState('reduced-motion', this.motionCtrl.isReducedMotion);
  }

  private formatStatusText(users: ReadonlyArray<string>): string {
    if (this.label.trim()) return this.label.trim();
    if (users.length === 0) return '';
    if (users.length === 1) {
      return this.t('singleTyping', { first: users[0]! });
    }
    if (users.length === 2) {
      return this.t('pairTyping', { first: users[0]!, second: users[1]! });
    }
    const othersCount = users.length - 1;
    const effectiveLocale = this.locale || this.resolvedLocale;
    const pluralCat = new Intl.PluralRules(effectiveLocale).select(othersCount);
    const formattedCount = new Intl.NumberFormat(effectiveLocale).format(othersCount);
    const fallbackTemplate =
      pluralCat === 'one'
        ? typingIndicatorMessages.groupTyping.one
        : typingIndicatorMessages.groupTyping.other;
    return this.t(
      'groupTyping',
      { first: users[0]!, count: othersCount, formattedCount },
      fallbackTemplate
        .replace('{first}', users[0]!)
        .replace('{count}', formattedCount),
    );
  }

  protected override render() {
    const activeUsers = this.getSanitizedUsers();
    const message = this.formatStatusText(activeUsers);
    const isActive = message.length > 0;

    return html`
      <div
        class="base"
        part="base"
        dir=${resolveEffectiveDir(this, this.resolvedDir)}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        ?hidden=${!isActive}
      >
        ${isActive
          ? html`
              <span class="dots" part="dots" aria-hidden="true">
                <span class="dot" part="dot"></span>
                <span class="dot" part="dot"></span>
                <span class="dot" part="dot"></span>
              </span>
              <span class="text" part="text">${message}</span>
            `
          : null}
      </div>
    `;
  }
}
