import { UIElement, type PropertyValues } from '@methane/core';
import {
  HotkeyController,
  ListboxController,
  OverlayController,
  type OverlayCloseReason,
} from '@methane/primitives';
import { html, nothing, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { commandPaletteMessages } from './command-palette.messages.js';
import {
  EMPTY_COMMAND_PALETTE_ITEMS,
  type CommandPaletteItem,
} from './command-palette.spec.js';
import { commandPaletteStyles } from './command-palette.styles.js';

export type { CommandPaletteItem };

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
 * `<mth-command-palette>`: Modal `Cmd/Ctrl+K` command launcher with filtered listbox
 * navigation, top-layer `<dialog>` + fallback support, and document hotkey registration.
 */
export class MthCommandPalette extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = commandPaletteMessages;
  static override styles = [commandPaletteStyles];

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String })
  query = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: String })
  shortcut = 'mod+k';

  @property({ type: Boolean, attribute: 'register-global-shortcut' })
  registerGlobalShortcut = true;

  @property({ type: Boolean, attribute: 'force-fallback' })
  forceFallback = false;

  @property({ attribute: false })
  commands: ReadonlyArray<CommandPaletteItem> = EMPTY_COMMAND_PALETTE_ITEMS;

  @state()
  private activeDescendantId = '';

  @query('#mth-cp-dialog')
  private dialogEl!: HTMLDialogElement | null;

  @query('#mth-cp-input')
  private inputEl!: HTMLInputElement | null;

  @query('#mth-cp-listbox')
  private listboxEl!: HTMLElement | null;

  private readonly overlayCtrl: OverlayController;
  private readonly listboxCtrl: ListboxController;
  private hotkeyCtrl: HotkeyController | null = null;

  private syncingOpen = false;
  private isHydratingSync = false;

  constructor() {
    super();

    this.overlayCtrl = new OverlayController(this, {
      mode: 'dialog',
      surface: () => this.dialogEl,
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      forceFallback: this.forceFallback,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingOpen = true;
        this.open = nextOpen;
        this.syncingOpen = false;
        this.setCustomState('open', nextOpen);
        if (nextOpen) {
          void this.updateComplete.then(() => {
            this.syncListboxOptions();
            this.inputEl?.focus();
          });
        }
        this.requestUpdate();
      },
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
        const matched = this.commands.find((c) => c.id === chosenId);
        if (!matched || matched.disabled) return;
        this.emitSelect(matched);
      },
    });

    this.hotkeyCtrl = new HotkeyController(this);
  }

  get filteredCommands(): ReadonlyArray<CommandPaletteItem> {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.commands;
    return this.commands.filter((cmd) => {
      if (cmd.label.toLowerCase().includes(q)) return true;
      if (cmd.description?.toLowerCase().includes(q)) return true;
      if (cmd.group?.toLowerCase().includes(q)) return true;
      return cmd.keywords?.some((kw) => kw.toLowerCase().includes(q)) ?? false;
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncHotkeyRegistration();
  }

  async show(): Promise<boolean> {
    return this.overlayCtrl.show();
  }

  async hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    return this.overlayCtrl.hide(reason);
  }

  async toggle(): Promise<boolean> {
    return this.overlayCtrl.toggle();
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
    }
    if (changed.has('commands') || changed.has('query')) {
      this.setCustomState('empty', this.filteredCommands.length === 0);
      this.syncListboxOptions();
    }
    if (changed.has('shortcut') || changed.has('registerGlobalShortcut')) {
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

  private syncHotkeyRegistration(): void {
    this.hotkeyCtrl?.remove('mth-cp-toggle');
    if (!this.hotkeyCtrl || !this.registerGlobalShortcut || !this.shortcut.trim()) {
      return;
    }
    this.hotkeyCtrl.add({
      id: 'mth-cp-toggle',
      combo: this.shortcut,
      scope: typeof document !== 'undefined' ? document : this,
      allowInInput: true,
      preventDefault: true,
      handler: () => {
        void this.toggle();
      },
    });
  }

  private syncListboxOptions(): void {
    const items = this.filteredCommands.map((cmd, idx) => ({
      id: `mth-cp-opt-${idx}`,
      value: cmd.id,
      label: cmd.label,
      ...(cmd.disabled !== undefined ? { disabled: cmd.disabled } : {}),
      ...(cmd.group !== undefined ? { group: cmd.group } : {}),
    }));
    this.listboxCtrl.setOptions(items);
  }

  private emitSelect(cmd: CommandPaletteItem): void {
    this.emitEvent('mth-select', {
      detail: {
        id: cmd.id,
        label: cmd.label,
        ...(cmd.href && isSafeHref(cmd.href) ? { href: cmd.href.trim() } : {}),
      },
    });
    void this.hide('programmatic');
  }

  private handleInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.query = input.value;
    this.activeDescendantId = '';
    this.emitEvent('mth-query-change', {
      detail: { query: this.query },
    });
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
      if (event.key === 'ArrowDown') {
        const next = Math.min(
          Math.max(0, this.listboxCtrl.activeIndex + 1),
          this.filteredCommands.length - 1,
        );
        this.listboxCtrl.setActiveIndex(next);
      } else if (event.key === 'ArrowUp') {
        const prev = Math.max(0, this.listboxCtrl.activeIndex - 1);
        this.listboxCtrl.setActiveIndex(prev);
      } else if (event.key === 'Home') {
        this.listboxCtrl.setActiveIndex(0);
      } else if (event.key === 'End') {
        this.listboxCtrl.setActiveIndex(Math.max(0, this.filteredCommands.length - 1));
      } else if (event.key === 'Enter') {
        if (this.listboxCtrl.activeIndex < 0 && this.filteredCommands.length > 0) {
          this.listboxCtrl.setActiveIndex(0);
        }
        this.listboxCtrl.selectActive();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      void this.hide('escape');
    }
  }

  private handleDialogClick(event: MouseEvent): void {
    if (event.target === this.dialogEl) {
      void this.hide('outside');
    }
  }

  private renderCommandOptions(): Array<TemplateResult> {
    const filtered = this.filteredCommands;
    if (filtered.length === 0) {
      return [];
    }

    const out: Array<TemplateResult> = [];
    let lastGroup: string | undefined;
    const activeId = this.listboxCtrl.activeOption?.id ?? this.activeDescendantId;
    const selected = new Set(this.listboxCtrl.selectedValues);

    filtered.forEach((cmd, idx) => {
      if (cmd.group && cmd.group !== lastGroup) {
        lastGroup = cmd.group;
        out.push(html`<div part="group-label" role="presentation">${cmd.group}</div>`);
      }
      const optId = `mth-cp-opt-${idx}`;
      const isSelected = selected.has(cmd.id);
      const isActive = activeId === optId;

      out.push(html`
        <div
          id=${optId}
          part="option"
          role="option"
          data-value=${cmd.id}
          data-active=${isActive ? 'true' : nothing}
          aria-selected=${isSelected ? 'true' : 'false'}
          aria-disabled=${cmd.disabled ? 'true' : nothing}
          @click=${() => {
            if (!cmd.disabled) {
              this.listboxCtrl.selectValue(cmd.id);
            }
          }}
        >
          <span>${cmd.label}</span>
          ${cmd.shortcut ? html`<kbd part="shortcut">${cmd.shortcut}</kbd>` : nothing}
        </div>
      `);
    });

    return out;
  }

  protected override render() {
    const dialogLabel = this.label.trim() || this.t('dialogLabel');
    const searchPlaceholder = this.placeholder.trim() || this.t('searchPlaceholder');
    const filtered = this.filteredCommands;

    return html`
      <dialog
        id="mth-cp-dialog"
        part="dialog"
        aria-label=${dialogLabel}
        ?hidden=${!this.open}
        @click=${this.handleDialogClick}
        @cancel=${(e: Event) => {
          e.preventDefault();
          void this.hide('escape');
        }}
      >
        <div part="header">
          <slot name="header"></slot>
          <input
            id="mth-cp-input"
            part="input"
            type="text"
            role="combobox"
            autocomplete="off"
            aria-label=${this.t('searchLabel')}
            aria-autocomplete="list"
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-controls="mth-cp-listbox"
            aria-activedescendant=${this.activeDescendantId || nothing}
            placeholder=${searchPlaceholder}
            .value=${this.query}
            @input=${this.handleInputChange}
            @keydown=${this.handleInputKeyDown}
          />
        </div>

        <div
          id="mth-cp-listbox"
          part="listbox"
          role="listbox"
          tabindex="0"
          aria-label=${this.t('resultsLabel')}
        >
          ${filtered.length > 0
            ? this.renderCommandOptions()
            : html`<div part="empty"><slot name="empty">${this.t('emptyResults')}</slot></div>`}
        </div>

        <div part="footer">
          <slot name="footer"></slot>
        </div>
      </dialog>
    `;
  }
}
