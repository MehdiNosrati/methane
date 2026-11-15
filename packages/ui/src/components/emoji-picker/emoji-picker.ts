import { UIElement, type PropertyValues } from '@methane/core';
import {
  OverlayController,
  PositioningController,
  RovingFocusController,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { emojiPickerMessages } from './emoji-picker.messages.js';
import { emojiPickerStyles } from './emoji-picker.styles.js';

export interface EmojiEntry {
  readonly emoji: string;
  readonly name: string;
  readonly category: string;
  readonly keywords?: ReadonlyArray<string>;
  readonly skinToneSupport?: boolean;
}

export interface EmojiSelectDetail {
  readonly emoji: string;
  readonly name: string;
  readonly category: string;
}

const SKIN_TONE_MODIFIERS = ['', '\u{1F3FB}', '\u{1F3FC}', '\u{1F3FD}', '\u{1F3FE}', '\u{1F3FF}'] as const;
const SKIN_TONE_SWATCHES = ['🟡', '🏻', '🏼', '🏽', '🏾', '🏿'] as const;

export const DEFAULT_EMOJIS: ReadonlyArray<EmojiEntry> = [
  { emoji: '😀', name: 'Grinning face', category: 'Smileys', keywords: ['smile', 'happy'] },
  { emoji: '😂', name: 'Face with tears of joy', category: 'Smileys', keywords: ['laugh', 'funny'] },
  { emoji: '😍', name: 'Smiling face with heart-eyes', category: 'Smileys', keywords: ['love', 'heart'] },
  { emoji: '🤔', name: 'Thinking face', category: 'Smileys', keywords: ['hmm', 'consider'] },
  { emoji: '🥳', name: 'Partying face', category: 'Smileys', keywords: ['celebrate', 'party'] },
  { emoji: '😎', name: 'Smiling face with sunglasses', category: 'Smileys', keywords: ['cool', 'shades'] },
  { emoji: '👍', name: 'Thumbs up', category: 'Gestures', keywords: ['approve', 'ok', 'yes'], skinToneSupport: true },
  { emoji: '👏', name: 'Clapping hands', category: 'Gestures', keywords: ['applause', 'bravo'], skinToneSupport: true },
  { emoji: '🙌', name: 'Raising hands', category: 'Gestures', keywords: ['hooray', 'celebrate'], skinToneSupport: true },
  { emoji: '👋', name: 'Waving hand', category: 'Gestures', keywords: ['hello', 'bye'], skinToneSupport: true },
  { emoji: '🌿', name: 'Herb', category: 'Nature', keywords: ['plant', 'leaf', 'green'] },
  { emoji: '🔥', name: 'Fire', category: 'Nature', keywords: ['hot', 'flame', 'lit'] },
  { emoji: '🌟', name: 'Glowing star', category: 'Nature', keywords: ['star', 'sparkle'] },
  { emoji: '☕', name: 'Hot beverage', category: 'Food', keywords: ['coffee', 'tea'] },
  { emoji: '🍕', name: 'Pizza', category: 'Food', keywords: ['slice', 'food'] },
  { emoji: '🚀', name: 'Rocket', category: 'Objects', keywords: ['launch', 'ship', 'fast'] },
  { emoji: '💡', name: 'Light bulb', category: 'Objects', keywords: ['idea', 'bright'] },
  { emoji: '✅', name: 'Check mark button', category: 'Symbols', keywords: ['done', 'pass', 'check'] },
];

/**
 * `<mth-emoji-picker>`: accessible emoji picker supporting keyword search,
 * categories, Fitzpatrick skin-tone modifiers, recent emojis, and 2D roving focus.
 */
export class MthEmojiPicker extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = emojiPickerMessages;
  static override styles = emojiPickerStyles;

  @property({ type: String })
  value = '';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  inline = false;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Number })
  columns = 6;

  @property({ type: Number, attribute: 'skin-tone' })
  skinTone = 0;

  @property({ type: Number, attribute: 'recent-limit' })
  recentLimit = 12;

  @property({ attribute: false })
  emojis: ReadonlyArray<EmojiEntry> | null = null;

  @state()
  private queryText = '';

  @state()
  private activeCategory = 'All';

  @state()
  private recentList: ReadonlyArray<EmojiEntry> = [];

  @query('.trigger')
  private triggerEl!: HTMLButtonElement;

  @query('.panel')
  private panelEl!: HTMLElement;

  private syncingOpen = false;
  private readonly rovingCtrl: RovingFocusController;
  private readonly overlayCtrl: OverlayController;
  private readonly positionCtrl: PositioningController;

  constructor() {
    super();

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="emoji-button"]:not(:disabled)') ?? []),
      orientation: 'both',
      columns: this.columns,
      loop: true,
    });

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.panelEl,
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      onOpenChange: (nextOpen) => {
        if (this.syncingOpen) return;
        this.syncingOpen = true;
        this.open = nextOpen;
        this.syncingOpen = false;
        if (nextOpen) {
          void this.updateComplete.then(() => {
            this.positionCtrl.reposition();
            this.rovingCtrl.syncTabIndices();
          });
        }
      },
    });

    this.positionCtrl = new PositioningController(this, {
      anchor: () => this.triggerEl,
      floating: () => this.panelEl,
      placement: 'bottom-start',
      offset: 6,
      flip: true,
      shift: true,
    });
  }

  async show(): Promise<void> {
    if (this.disabled || this.inline) return;
    await this.syncOverlay(true);
    await this.updateComplete;
  }

  async hide(): Promise<void> {
    if (this.inline) return;
    await this.syncOverlay(false);
    await this.updateComplete;
  }

  protected override firstUpdated(): void {
    this.rovingCtrl.updateOptions({ columns: Math.max(1, this.columns) });
    if (!this.inline && this.open && !this.disabled) {
      void this.syncOverlay(true);
    }
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('columns')) {
      this.rovingCtrl.updateOptions({ columns: Math.max(1, this.columns) });
      this.style.setProperty('--mth-emoji-columns', String(Math.max(1, this.columns)));
    }
    if (changed.has('open') && !this.inline && !this.syncingOpen) {
      void this.syncOverlay(this.open);
    }
    this.rovingCtrl.syncTabIndices();
  }

  private async syncOverlay(nextOpen: boolean): Promise<void> {
    this.syncingOpen = true;
    try {
      if (nextOpen) {
        if (this.disabled) {
          this.open = false;
          return;
        }
        const opened = await this.overlayCtrl.show();
        this.open = opened;
        if (opened) {
          this.positionCtrl.reposition();
        }
      } else {
        const closed = await this.overlayCtrl.hide();
        this.open = !closed;
      }
    } finally {
      this.syncingOpen = false;
    }
  }

  private getDataset(): ReadonlyArray<EmojiEntry> {
    return this.emojis ?? DEFAULT_EMOJIS;
  }

  private getCategories(): ReadonlyArray<string> {
    const names: string[] = [emojiPickerMessages.allCategory];
    if (this.recentList.length > 0) {
      names.push(emojiPickerMessages.recentCategory);
    }
    for (const entry of this.getDataset()) {
      if (!names.includes(entry.category)) {
        names.push(entry.category);
      }
    }
    return names;
  }

  private getFilteredEmojis(): ReadonlyArray<EmojiEntry> {
    const q = this.queryText.trim().toLowerCase();
    const source =
      this.activeCategory === emojiPickerMessages.recentCategory
        ? this.recentList
        : this.getDataset().filter(
            (e) =>
              this.activeCategory === emojiPickerMessages.allCategory || e.category === this.activeCategory,
          );

    if (!q) return source;
    return source.filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q) ||
        (entry.keywords?.some((kw) => kw.toLowerCase().includes(q)) ?? false),
    );
  }

  private applySkinTone(entry: EmojiEntry): string {
    if (!entry.skinToneSupport) return entry.emoji;
    const clamped = Math.max(0, Math.min(5, Math.trunc(this.skinTone)));
    const modifier = SKIN_TONE_MODIFIERS[clamped] ?? '';
    return modifier ? `${entry.emoji}${modifier}` : entry.emoji;
  }

  private handleSelectEmoji(entry: EmojiEntry): void {
    if (this.disabled) return;
    const renderedEmoji = this.applySkinTone(entry);
    this.value = renderedEmoji;

    const deduped = this.recentList.filter((item) => item.emoji !== entry.emoji);
    this.recentList = [entry, ...deduped].slice(0, Math.max(0, this.recentLimit));

    this.dispatchEvent(
      new CustomEvent<EmojiSelectDetail>('mth-select', {
        bubbles: true,
        composed: true,
        detail: {
          emoji: renderedEmoji,
          name: entry.name,
          category: entry.category,
        },
      }),
    );

    this.dispatchEvent(
      new CustomEvent<{ value: string }>('mth-change', {
        bubbles: true,
        composed: true,
        detail: { value: renderedEmoji },
      }),
    );

    if (!this.inline) {
      this.open = false;
    }
  }

  private handleTriggerClick = (): void => {
    if (this.disabled) return;
    this.open = !this.open;
  };

  protected override render() {
    const categories = this.getCategories();
    const visible = this.getFilteredEmojis();
    const isPanelVisible = this.inline || this.open;

    return html`
      <div class="base" part="base">
        ${!this.inline
          ? html`
              <button
                type="button"
                class="trigger"
                part="trigger"
                aria-haspopup="dialog"
                aria-expanded=${this.open ? 'true' : 'false'}
                aria-label=${this.label || emojiPickerMessages.triggerLabel}
                ?disabled=${this.disabled}
                @click=${this.handleTriggerClick}
              >
                <slot name="trigger">${this.value || '😀'}</slot>
              </button>
            `
          : nothing}

        <div
          class="panel ${this.inline ? '' : 'popover'}"
          part="panel"
          role=${this.inline ? 'region' : 'dialog'}
          aria-label=${this.label || emojiPickerMessages.pickerLabel}
          ?hidden=${!isPanelVisible}
        >
          <div class="header" part="header">
            <input
              type="search"
              class="search"
              part="search"
              aria-label=${emojiPickerMessages.searchLabel}
              placeholder=${emojiPickerMessages.searchPlaceholder}
              .value=${this.queryText}
              ?disabled=${this.disabled}
              @input=${(e: Event) => {
                this.queryText = (e.currentTarget as HTMLInputElement).value;
              }}
            />

            <div class="skin-tones" part="skin-tones" role="group" aria-label=${emojiPickerMessages.skinToneLabel}>
              ${SKIN_TONE_SWATCHES.map(
                (swatch, idx) => html`
                  <button
                    type="button"
                    class="tone-btn"
                    aria-label=${`${emojiPickerMessages.skinToneLabel} ${idx}`}
                    aria-pressed=${this.skinTone === idx ? 'true' : 'false'}
                    ?disabled=${this.disabled}
                    @click=${() => {
                      this.skinTone = idx;
                    }}
                  >
                    ${swatch}
                  </button>
                `,
              )}
            </div>
          </div>

          <div class="categories" part="categories" role="group" aria-label="Emoji categories">
            ${categories.map(
              (cat) => html`
                <button
                  type="button"
                  class="category"
                  part="category"
                  aria-pressed=${this.activeCategory === cat ? 'true' : 'false'}
                  ?disabled=${this.disabled}
                  @click=${() => {
                    this.activeCategory = cat;
                  }}
                >
                  ${cat}
                </button>
              `,
            )}
          </div>

          <div class="grid" part="grid" role="group" aria-label="Emojis">
            ${visible.length === 0
              ? html`<div class="empty">${emojiPickerMessages.emptyText}</div>`
              : visible.map((entry) => {
                  const char = this.applySkinTone(entry);
                  return html`
                    <button
                      type="button"
                      class="emoji-button"
                      part="emoji-button"
                      aria-label=${entry.name}
                      aria-pressed=${this.value === char ? 'true' : 'false'}
                      ?disabled=${this.disabled}
                      @click=${() => this.handleSelectEmoji(entry)}
                    >
                      ${char}
                    </button>
                  `;
                })}
          </div>
        </div>
      </div>
    `;
  }
}
