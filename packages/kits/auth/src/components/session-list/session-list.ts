import { UIElement, html, nothing, property } from '@methane-ui/core';
import { sessionListMessages } from './session-list.messages.js';
import { sessionListStyles } from './session-list.styles.js';

export interface SessionListItem {
  readonly id: string;
  readonly device: string;
  readonly browser?: string;
  readonly location?: string;
  readonly ip?: string;
  readonly lastActive?: string;
  readonly current?: boolean;
}

/**
 * `<mth-session-list>`: active authenticated session list with current-session badge,
 * device/network metadata, and single/bulk revocation actions.
 */
export class MthSessionList extends UIElement {
  static override messages = sessionListMessages;
  static override styles = sessionListStyles;

  @property({ attribute: false })
  sessions: ReadonlyArray<SessionListItem> = [];

  @property({ type: String })
  heading = '';

  @property({ type: Boolean, reflect: true, attribute: 'allow-revoke-current' })
  allowRevokeCurrent = false;

  @property({ type: Boolean, reflect: true })
  loading = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  private handleRevoke(session: SessionListItem): void {
    if (this.disabled || this.loading) return;
    if (session.current && !this.allowRevokeCurrent) return;
    this.emitEvent('mth-revoke', {
      detail: {
        id: session.id,
        session,
      },
    });
  }

  private handleRevokeOthers(): void {
    if (this.disabled || this.loading) return;
    const otherIds = this.sessions.filter((s) => !s.current).map((s) => s.id);
    if (otherIds.length === 0) return;
    this.emitEvent('mth-revoke-others', {
      detail: {
        count: otherIds.length,
        sessionIds: otherIds,
      },
    });
  }

  private resolveEffectiveDir(): 'ltr' | 'rtl' {
    return (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl'
      ? 'rtl'
      : 'ltr';
  }

  override render() {
    const titleText = this.heading || this.t('heading');
    const otherSessions = this.sessions.filter((s) => !s.current);
    const controlsDisabled = this.disabled || this.loading;

    return html`
      <section part="base" class="container" dir=${this.resolveEffectiveDir()} aria-labelledby="mth-sl-title">
        <div class="header">
          <h2 class="title" id="mth-sl-title">${titleText}</h2>
          ${otherSessions.length > 0
            ? html`
                <button
                  type="button"
                  part="revoke-others"
                  class="revoke-others-btn"
                  ?disabled=${controlsDisabled}
                  @click=${this.handleRevokeOthers}
                >
                  ${this.t('revokeOthers')}
                </button>
              `
            : nothing}
        </div>

        ${this.sessions.length > 0
          ? html`
              <ul class="list">
                ${this.sessions.map((session) => {
                  const canRevoke = Boolean(!session.current || this.allowRevokeCurrent);
                  const deviceLabel = session.browser
                    ? `${session.device} · ${session.browser}`
                    : session.device;

                  return html`
                    <li
                      part="item"
                      class="session-card"
                      data-current=${session.current ? 'true' : 'false'}
                    >
                      <div class="session-info">
                        <div class="session-top">
                          <span class="device-name">${deviceLabel}</span>
                          ${session.current
                            ? html`<mth-badge variant="success">${this.t('currentBadge')}</mth-badge>`
                            : nothing}
                        </div>
                        <div class="meta">
                          ${session.location ? html`<span>${session.location}</span>` : nothing}
                          ${session.ip
                            ? html`<span>${this.t('ipPrefix', { ip: session.ip })}</span>`
                            : nothing}
                          ${session.lastActive
                            ? html`<span>${this.t('lastActivePrefix', { lastActive: session.lastActive })}</span>`
                            : nothing}
                        </div>
                      </div>

                      ${canRevoke
                        ? html`
                            <button
                              type="button"
                              part="revoke"
                              class="revoke-btn"
                              aria-label=${this.t('revokeAriaLabel', { device: session.device })}
                              ?disabled=${controlsDisabled}
                              @click=${() => this.handleRevoke(session)}
                            >
                              ${this.t('revoke')}
                            </button>
                          `
                        : nothing}
                    </li>
                  `;
                })}
              </ul>
            `
          : html`<p class="empty">${this.t('emptyState')}</p>`}

        <slot></slot>
      </section>
    `;
  }
}
