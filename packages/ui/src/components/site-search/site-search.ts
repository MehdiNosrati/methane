import { UIElement, type PropertyValues } from '@methane/core';
import {
  createArrayDataSource,
  DataController,
  HotkeyController,
  ListboxController,
  OverlayController,
  PositioningController,
  type DataControllerStatus,
  type DataSource,
  type OverlayCloseReason,
} from '@methane/primitives';
import { html, nothing, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { siteSearchMessages } from './site-search.messages.js';
import { EMPTY_SITE_SEARCH_ITEMS, type SiteSearchItem } from './site-search.spec.js';
import { siteSearchStyles } from './site-search.styles.js';

export type { SiteSearchItem };

function isSafeHref(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^(\/|\.\/|\.\.\/|\?|#)/.test(trimmed)) return !trimmed.startsWith('//');
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed);
  if (!schemeMatch) return !trimmed.startsWith('//');
  const scheme = schemeMatch[1]!.toLowerCase();
  return scheme === 'https' || scheme === 'http' || scheme === 'mailto' || scheme === 'tel';
}

/**
 * `<mth-site-search>`: Async searchable combobox backed by `DataController`,
 * active-descendant `ListboxController`, positioned `[popover]`, and optional shortcut focus.
 */
export class MthSiteSearch extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = siteSearchMessages;
  static override styles = [siteSearchStyles];

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String })
  query = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: String })
  shortcut = '/';

  @property({ type: Boolean, attribute: 'register-shortcut' })
  registerShortcut = false;

  @property({ type: Boolean, attribute: 'force-fallback' })
  forceFallback = false;

  @property({ attribute: false })
  items: ReadonlyArray<SiteSearchItem> = EMPTY_SITE_SEARCH_ITEMS;

  @property({ attribute: false })
  dataSource: DataSource<SiteSearchItem, unknown> | null = null;

  @state()
  private activeDescendantId = '';

  @query('#mth-ss-combobox')
  private comboboxEl!: HTMLElement | null;

  @query('#mth-ss-input')
  private inputEl!: HTMLInputElement | null;

  @query('#mth-ss-popup')
  private popupEl!: HTMLElement | null;

  @query('#mth-ss-listbox')
  private listboxEl!: HTMLElement | null;

  readonly dataCtrl: DataController<SiteSearchItem, unknown>;
  private readonly listboxCtrl: ListboxController;
  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private hotkeyCtrl: HotkeyController | null = null;

  private syncingOpen = false;
  private isHydratingSync = false;

  constructor() {
    super();

    this.dataCtrl = new DataController<SiteSearchItem, unknown>(this, {
      cacheTimeMs: 0,
      autoLoad: false,
      onStateChange: (status) => {
        this.syncStateCustomStates(status);
        this.syncListboxOptions();
      },
    });

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.popupEl,
      trigger: () => this.inputEl,
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: false,
      forceFallback: this.forceFallback,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingOpen = true;
        this.open = nextOpen;
        this.syncingOpen = false;
        this.setCustomState('open', nextOpen);
        if (!nextOpen) {
          this.positioningCtrl.stop();
        }
        this.requestUpdate();
      },
    });

    this.positioningCtrl = new PositioningController(this, {
      anchor: () => this.comboboxEl ?? this,
      floating: () => this.popupEl,
      placement: 'bottom-start',
      offset: 4,
      flip: true,
      shift: true,
      forceFallback: this.forceFallback,
    });

    this.listboxCtrl = new ListboxController(this, {
      focusMode: 'activedescendant',
      multiple: false,
      loop: true,
      getListboxElement: () => this.listboxEl,
      getOptionElements: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="option"]') ?? []),
      onActiveChange: (option) => {
        this.activeDescendantId = option?.id ?? '';
      },
      onSelectionChange: (selectedValues) => {
        const chosenId = selectedValues[0];
        if (!chosenId) return;
        const matched = this.resultItems.find((item) => item.id === chosenId);
        if (!matched) return;
        this.emitSelect(matched);
      },
    });

    this.hotkeyCtrl = new HotkeyController(this);
  }

  get dataStatus(): DataControllerStatus {
    return this.dataCtrl.status;
  }

  get resultItems(): ReadonlyArray<SiteSearchItem> {
    return this.dataCtrl.items;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncDataSource();
    this.syncHotkeyRegistration();
  }

  async show(): Promise<boolean> {
    const shown = await this.overlayCtrl.show();
    if (shown) {
      await this.updateComplete;
      await this.positioningCtrl.start();
    }
    return shown;
  }

  async hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    return this.overlayCtrl.hide(reason);
  }

  async search(nextQuery: string): Promise<void> {
    this.query = nextQuery;
    if (!this.dataSource && this.items.length > 0) {
      this.syncDataSource();
    }
    await this.dataCtrl.setFilter(nextQuery);
    this.syncListboxOptions();
  }

  protected override onFirstConnect(): void {
    this.isHydratingSync = true;
    this.setCustomState('open', this.open);
    this.isHydratingSync = false;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('forceFallback')) {
      this.overlayCtrl.updateOptions({ forceFallback: this.forceFallback });
      this.positioningCtrl.updateOptions({ forceFallback: this.forceFallback });
    }
    if (changed.has('dataSource') || changed.has('items')) {
      this.syncDataSource();
    }
    if (changed.has('shortcut') || changed.has('registerShortcut')) {
      this.syncHotkeyRegistration();
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('open') && !this.syncingOpen && !this.isHydratingSync) {
      if (this.open) {
        void this.show();
      } else {
        void this.hide('programmatic');
      }
    }
  }

  private syncDataSource(): void {
    if (this.dataSource) {
      this.dataCtrl.setDataSource(this.dataSource, { load: false });
      return;
    }
    if (this.items.length > 0) {
      const localSource = createArrayDataSource<SiteSearchItem & Record<string, unknown>>(
        this.items.map((entry) => ({ ...entry })),
        (item, filter) => {
          const q = typeof filter === 'string' ? filter.trim().toLowerCase() : '';
          if (!q) return true;
          return (
            item.label.toLowerCase().includes(q) ||
            Boolean(item.category?.toLowerCase().includes(q)) ||
            Boolean(item.snippet?.toLowerCase().includes(q))
          );
        },
      );
      this.dataCtrl.setDataSource(localSource, { load: false });
      return;
    }
    this.dataCtrl.setDataSource(null);
  }

  private syncStateCustomStates(status: DataControllerStatus): void {
    this.setCustomState('loading', status === 'loading' || status === 'refreshing');
    this.setCustomState('empty', status === 'empty');
    this.setCustomState('error', status === 'error');
  }

  private syncHotkeyRegistration(): void {
    this.hotkeyCtrl?.remove('mth-ss-focus');
    if (!this.hotkeyCtrl || !this.registerShortcut || !this.shortcut.trim()) {
      return;
    }
    this.hotkeyCtrl.add({
      id: 'mth-ss-focus',
      combo: this.shortcut,
      scope: typeof document !== 'undefined' ? document : this,
      allowInInput: false,
      preventDefault: true,
      handler: () => {
        this.inputEl?.focus();
      },
    });
  }

  private syncListboxOptions(): void {
    const opts = this.resultItems.map((item, idx) => ({
      id: `mth-ss-opt-${idx}`,
      value: item.id,
      label: item.label,
    }));
    this.listboxCtrl.setOptions(opts);
  }

  private emitSelect(item: SiteSearchItem): void {
    this.emitEvent('mth-select', {
      detail: {
        id: item.id,
        label: item.label,
        ...(item.href && isSafeHref(item.href) ? { href: item.href.trim() } : {}),
      },
    });
    void this.hide('programmatic');
  }

  private handleInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query = value;
    this.activeDescendantId = '';
    this.emitEvent('mth-query-change', {
      detail: { query: value },
    });
    void this.search(value);
    if (value.trim().length > 0 && !this.open) {
      void this.show();
    }
  }

  private handleInputKeyDown(event: KeyboardEvent): void {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Home' ||
      event.key === 'End' ||
      event.key === 'Enter'
    ) {
      event.preventDefault();
      event.stopPropagation();
      const total = this.resultItems.length;
      if (event.key === 'Enter') {
        if (this.listboxCtrl.activeIndex < 0 && total > 0) {
          const optEls = Array.from(
            this.listboxEl?.querySelectorAll<HTMLElement>('[part="option"]') ?? [],
          );
          const firstEnabled = optEls.findIndex(
            (el) => el.getAttribute('aria-disabled') !== 'true',
          );
          if (firstEnabled >= 0) {
            this.listboxCtrl.setActiveIndex(firstEnabled);
          }
        }
        this.listboxCtrl.selectActive();
      } else if (total > 0) {
        if (event.key === 'ArrowDown' && !this.open) {
          void this.show();
        }
        this.listboxEl?.dispatchEvent(
          new KeyboardEvent('keydown', { key: event.key, cancelable: true }),
        );
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      void this.hide('escape');
    }
  }

  private renderResults(): TemplateResult | typeof nothing {
    const status = this.dataCtrl.status;
    if (status === 'loading' && this.resultItems.length === 0) {
      return html`<div part="status" role="status">${this.t('loadingResults')}</div>`;
    }
    if (status === 'error') {
      return html`
        <div part="status" data-error="true" role="status">
          <slot name="error">${this.t('errorResults')}</slot>
        </div>
      `;
    }
    if (status === 'empty' || (status === 'ready' && this.resultItems.length === 0)) {
      return html`
        <div part="status" role="status">
          <slot name="empty">${this.t('emptyResults')}</slot>
        </div>
      `;
    }

    const activeId = this.listboxCtrl.activeOption?.id ?? this.activeDescendantId;
    const selected = new Set(this.listboxCtrl.selectedValues);

    return html`
      ${this.resultItems.map((item, idx) => {
        const optId = `mth-ss-opt-${idx}`;
        const isActive = activeId === optId;
        const isSelected = selected.has(item.id);
        return html`
          <div
            id=${optId}
            part="option"
            role="option"
            data-value=${item.id}
            data-active=${isActive ? 'true' : nothing}
            aria-selected=${isSelected ? 'true' : 'false'}
            @click=${() => this.listboxCtrl.selectValue(item.id)}
          >
            <span>${item.label}</span>
            ${item.category ? html`<span part="category">${item.category}</span>` : nothing}
          </div>
        `;
      })}
    `;
  }

  protected override render() {
    const inputLabel = this.label.trim() || this.t('searchLabel');
    const inputPlaceholder = this.placeholder.trim() || this.t('searchPlaceholder');

    return html`
      <div id="mth-ss-combobox" part="combobox">
        <slot name="leading"></slot>
        <input
          id="mth-ss-input"
          part="input"
          type="search"
          role="combobox"
          autocomplete="off"
          aria-label=${inputLabel}
          aria-autocomplete="list"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls="mth-ss-listbox"
          aria-activedescendant=${this.activeDescendantId || nothing}
          placeholder=${inputPlaceholder}
          .value=${this.query}
          @input=${this.handleInput}
          @keydown=${this.handleInputKeyDown}
        />
      </div>

      <div id="mth-ss-popup" part="popup" popover="manual" ?hidden=${!this.open}>
        <div
          id="mth-ss-listbox"
          part="listbox"
          role="listbox"
          tabindex="0"
          aria-label=${this.t('resultsLabel')}
        >
          ${this.renderResults()}
        </div>
      </div>
    `;
  }
}
