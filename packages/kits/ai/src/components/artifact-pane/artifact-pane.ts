import {
  UIElement,
  html,
  nothing,
  property,
  query,
  state,
  type PropertyValues,
} from '@methane/core';
import { ClipboardAndShare, MotionController, RovingFocusController } from '@methane/primitives';
import { safeSetHTML, safeSetMarkdown } from '@methane/sanitize';
import { artifactPaneMessages } from './artifact-pane.messages.js';
import { artifactPaneStyles } from './artifact-pane.styles.js';

export type MthArtifactKind = 'code' | 'html' | 'markdown';
export type MthArtifactTab = 'code' | 'preview';

export interface ArtifactVersion {
  readonly id: string;
  readonly label: string;
  readonly content: string;
  readonly kind?: MthArtifactKind;
  readonly language?: string;
  readonly title?: string;
}

/**
 * `<mth-artifact-pane>`: tabbed AI artifact viewer with version switching,
 * `ClipboardAndShare` copy, close action, and strict `@methane/sanitize` preview.
 */
export class MthArtifactPane extends UIElement {
  static override messages = artifactPaneMessages;
  static override styles = artifactPaneStyles;

  @property({ type: Boolean, reflect: true })
  open = true;

  @property({ type: String })
  override title = '';

  @property({ type: String })
  kind: MthArtifactKind = 'code';

  @property({ type: String })
  language = 'text';

  @property({ type: String })
  content = '';

  @property({ attribute: false })
  versions: ReadonlyArray<ArtifactVersion> = [];

  @property({ type: String, attribute: 'active-version' })
  activeVersion = '';

  @property({ type: String, attribute: 'active-tab', reflect: true })
  activeTab: MthArtifactTab = 'code';

  @property({ type: Boolean, attribute: 'allow-raw-html' })
  allowRawHtml = false;

  @state()
  private copied = false;

  @query('[part="base"]')
  private paneEl!: HTMLElement | null;

  @query('[part="preview-body"]')
  private previewEl!: HTMLElement | null;

  private readonly rovingCtrl: RovingFocusController;
  private readonly motionCtrl: MotionController;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;
  private hasMounted = false;

  constructor() {
    super();

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () =>
        this.shadowRoot ? Array.from(this.shadowRoot.querySelectorAll<HTMLElement>('[role="tab"]')) : [],
      orientation: 'horizontal',
      loop: true,
      dir: this.resolvedDir,
    });

    this.motionCtrl = new MotionController(this, {
      target: () => this.paneEl,
      enterKeyframes: [{ opacity: 0 }, { opacity: 1 }],
      exitKeyframes: [{ opacity: 1 }, { opacity: 0 }],
      durationMs: 120,
      respectReducedMotion: true,
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('open', this.open);
    this.setCustomState('copied', this.copied);
  }

  override disconnectedCallback(): void {
    if (this.copiedTimer !== null) {
      clearTimeout(this.copiedTimer);
      this.copiedTimer = null;
    }
    super.disconnectedCallback();
  }

  protected override firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.hasMounted = true;
    if (this.activeTab === 'preview') {
      this.syncSanitizedPreview();
    }
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('open')) {
      this.setCustomState('open', this.open);
      if (this.hasMounted) {
        if (this.open) {
          void this.motionCtrl.open();
        } else {
          void this.motionCtrl.close();
        }
      }
    }
    if (changedProperties.has('copied')) {
      this.setCustomState('copied', this.copied);
    }
    this.rovingCtrl.updateOptions({ dir: this.resolvedDir });
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (
      this.activeTab === 'preview' &&
      (changedProperties.has('activeTab') ||
        changedProperties.has('content') ||
        changedProperties.has('kind') ||
        changedProperties.has('activeVersion') ||
        changedProperties.has('allowRawHtml'))
    ) {
      this.syncSanitizedPreview();
    }
  }

  private resolveCurrentArtifact(): {
    content: string;
    kind: MthArtifactKind;
    language: string;
    title: string;
  } {
    const matched = this.versions.find((v) => v.id === this.activeVersion);
    if (matched) {
      return {
        content: matched.content,
        kind: matched.kind ?? this.kind,
        language: matched.language ?? this.language,
        title: matched.title ?? this.title,
      };
    }
    return {
      content: this.content,
      kind: this.kind,
      language: this.language,
      title: this.title,
    };
  }

  private syncSanitizedPreview(): void {
    if (!this.previewEl) return;
    const current = this.resolveCurrentArtifact();
    if (current.kind === 'markdown') {
      safeSetMarkdown(this.previewEl, current.content, { allowRawHtml: this.allowRawHtml });
    } else if (current.kind === 'html') {
      safeSetHTML(this.previewEl, current.content);
    } else {
      this.previewEl.textContent = current.content;
    }
  }

  async copy(): Promise<boolean> {
    const current = this.resolveCurrentArtifact();
    const res = await ClipboardAndShare.copyText(current.content);
    this.copied = res.ok;
    this.setCustomState('copied', this.copied);
    if (res.ok) {
      if (this.copiedTimer !== null) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => {
        this.copied = false;
        this.setCustomState('copied', false);
        this.copiedTimer = null;
      }, 2000);
    }
    this.emitEvent('mth-copy', { detail: { content: current.content, ok: res.ok } });
    return res.ok;
  }

  close(reason = 'close-button'): boolean {
    const allowed = this.emitEvent('mth-close', {
      detail: { reason },
      cancelable: true,
    });
    if (allowed) {
      this.open = false;
    }
    return allowed;
  }

  setTab(tab: MthArtifactTab): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.emitEvent('mth-tab-change', { detail: { tab } });
  }

  private readonly handleVersionChange = (event: Event): void => {
    const value = (event.target as HTMLSelectElement).value;
    this.activeVersion = value;
    this.emitEvent('mth-version-change', { detail: { version: value } });
  };

  private readonly handleCopyClick = (): void => {
    void this.copy();
  };

  private readonly handleCloseClick = (): void => {
    this.close('close-button');
  };

  override render() {
    const current = this.resolveCurrentArtifact();
    const resolvedTitle = current.title || this.t('untitled');
    const codeTabId = 'mth-ap-tab-code';
    const previewTabId = 'mth-ap-tab-preview';
    const codePanelId = 'mth-ap-panel-code';
    const previewPanelId = 'mth-ap-panel-preview';

    return html`
      <section class="pane" part="base" aria-label=${resolvedTitle} ?hidden=${!this.open}>
        <header class="header" part="header">
          <div class="title-group">
            <h2 class="title">${resolvedTitle}</h2>
            ${current.language
              ? html`<mth-badge variant="neutral" size="sm">${current.language}</mth-badge>`
              : nothing}
          </div>

          <div class="toolbar">
            ${this.versions.length > 0
              ? html`
                  <select
                    class="version-select"
                    aria-label=${this.t('versionLabel')}
                    .value=${this.activeVersion || (this.versions[0]?.id ?? '')}
                    @change=${this.handleVersionChange}
                  >
                    ${this.versions.map(
                      (v) =>
                        html`<option value=${v.id} ?selected=${v.id === this.activeVersion}>${v.label}</option>`,
                    )}
                  </select>
                `
              : nothing}

            <div class="tabs" role="tablist" aria-label=${resolvedTitle}>
              <button
                id=${codeTabId}
                type="button"
                class="tab"
                role="tab"
                aria-selected=${this.activeTab === 'code' ? 'true' : 'false'}
                aria-controls=${codePanelId}
                @click=${() => this.setTab('code')}
              >
                ${this.t('codeTabLabel')}
              </button>
              <button
                id=${previewTabId}
                type="button"
                class="tab"
                role="tab"
                aria-selected=${this.activeTab === 'preview' ? 'true' : 'false'}
                aria-controls=${previewPanelId}
                @click=${() => this.setTab('preview')}
              >
                ${this.t('previewTabLabel')}
              </button>
            </div>

            <slot name="actions"></slot>

            <mth-button variant="ghost" size="sm" part="copy-button" @click=${this.handleCopyClick}>
              <mth-icon name=${this.copied ? 'check' : 'copy'} size="xs"></mth-icon>
              <span>${this.copied ? this.t('copiedLabel') : this.t('copyLabel')}</span>
            </mth-button>

            <mth-button
              variant="ghost"
              size="sm"
              part="close-button"
              aria-label=${this.t('closeLabel')}
              @click=${this.handleCloseClick}
            >
              <mth-icon name="close" size="xs"></mth-icon>
            </mth-button>
          </div>
        </header>

        <div class="body">
          <div
            id=${codePanelId}
            role="tabpanel"
            aria-labelledby=${codeTabId}
            ?hidden=${this.activeTab !== 'code'}
          >
            <pre class="code" part="code"><code>${current.content}</code></pre>
          </div>

          <div
            id=${previewPanelId}
            role="tabpanel"
            aria-labelledby=${previewTabId}
            ?hidden=${this.activeTab !== 'preview'}
          >
            <div class="preview-body" part="preview-body"></div>
          </div>
        </div>
      </section>
    `;
  }
}
