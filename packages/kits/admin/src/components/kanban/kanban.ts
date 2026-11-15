import { UIElement, type PropertyValues } from '@methane/core';
import {
  DataController,
  DragSortController,
  RovingFocusController,
  type DataControllerStatus,
  type DataSource,
} from '@methane/primitives';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { kanbanMessages } from './kanban.messages.js';
import { kanbanStyles } from './kanban.styles.js';

export interface KanbanLane {
  readonly id: string;
  readonly label: string;
  readonly wipLimit?: number;
}

export interface KanbanCard {
  readonly id: string;
  readonly laneId: string;
  readonly title: string;
  readonly assignee?: string;
  readonly priority?: string;
}

/**
 * `<mth-kanban>`: Multi-lane board with drag/keyboard sorting, cross-lane moves,
 * WIP limit indicators, and optional async DataSource card loading.
 */
export class MthKanban extends UIElement {
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = kanbanMessages;
  static override styles = kanbanStyles;

  @property({ attribute: false })
  lanes: ReadonlyArray<KanbanLane> = [];

  @property({ attribute: false })
  cards: ReadonlyArray<KanbanCard> = [];

  @property({ attribute: false })
  dataSource: DataSource<KanbanCard, string> | null = null;

  @property({ type: String })
  filter = '';

  private readonly dataCtrl: DataController<KanbanCard, string>;
  private readonly rovingFocus: RovingFocusController;
  readonly dragSort: DragSortController<HTMLElement>;
  private syncedSource: DataSource<KanbanCard, string> | null = null;
  private draggedCardId: string | null = null;

  constructor() {
    super();
    this.dataCtrl = new DataController<KanbanCard, string>(this, {
      autoLoad: false,
    });
    this.rovingFocus = new RovingFocusController(this, {
      getItems: () => this._getCardElements(),
      orientation: 'horizontal',
      loop: true,
      dir: 'auto',
    });
    this.dragSort = new DragSortController<HTMLElement>(this, {
      getItems: () => this._getCardElements(),
      orientation: 'vertical',
      onReorder: ({ fromIndex, toIndex }) => {
        const items = this._getCardElements();
        const fromId = items[fromIndex]?.dataset.cardId;
        const targetId = items[toIndex]?.dataset.cardId;
        if (!fromId || !targetId) return;
        const active = this._activeCards();
        const targetCard = active.find((c) => c.id === targetId);
        if (!targetCard) return;
        const laneCards = active.filter((c) => c.laneId === targetCard.laneId && c.id !== fromId);
        const destIndex = laneCards.findIndex((c) => c.id === targetId);
        this.moveCard(fromId, targetCard.laneId, destIndex === -1 ? laneCards.length : destIndex);
      },
    });
  }

  get dataStatus(): DataControllerStatus {
    return this.dataCtrl.status;
  }

  private _getCardElements(): HTMLElement[] {
    if (!this.shadowRoot) return [];
    return Array.from(this.shadowRoot.querySelectorAll<HTMLElement>('.card'));
  }

  private _activeCards(): ReadonlyArray<KanbanCard> {
    if (this.dataSource && (this.dataCtrl.status === 'ready' || this.dataCtrl.status === 'empty')) {
      return this.dataCtrl.items;
    }
    return this.cards;
  }

  private _syncDataSource(): void {
    if (this.dataSource && this.syncedSource !== this.dataSource) {
      this.syncedSource = this.dataSource;
      this.dataCtrl.setDataSource(this.dataSource);
    }
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this._syncDataSource();
    this.rovingFocus.updateOptions({
      dir: this.closest('[dir]') ? 'auto' : this.resolvedDir,
    });
    this.setCustomState('loading', this.dataCtrl.status === 'loading');
    this.setCustomState('empty', this.dataCtrl.status === 'empty');
    this.setCustomState('error', this.dataCtrl.status === 'error');
  }

  async query(filterOverride?: string): Promise<void> {
    this._syncDataSource();
    await this.dataCtrl.setFilter(filterOverride ?? this.filter);
  }

  moveCard(cardId: string, toLaneId: string, toIndex?: number): void {
    const currentCards = [...this._activeCards()];
    const existingIdx = currentCards.findIndex((c) => c.id === cardId);
    const existing = currentCards[existingIdx];
    if (!existing) return;

    const fromLaneId = existing.laneId;
    currentCards.splice(existingIdx, 1);

    const updatedCard: KanbanCard = { ...existing, laneId: toLaneId };
    const laneIndices: number[] = [];
    currentCards.forEach((c, idx) => {
      if (c.laneId === toLaneId) laneIndices.push(idx);
    });

    let insertAt = currentCards.length;
    if (laneIndices.length > 0) {
      const clamped = Math.max(0, Math.min(toIndex ?? laneIndices.length, laneIndices.length));
      insertAt = clamped < laneIndices.length ? (laneIndices[clamped] ?? currentCards.length) : (laneIndices[laneIndices.length - 1] ?? 0) + 1;
    }

    currentCards.splice(insertAt, 0, updatedCard);
    this.cards = currentCards;
    this.emitEvent('mth-card-move', {
      detail: {
        cardId,
        fromLaneId,
        toLaneId,
        toIndex: insertAt,
        cards: currentCards,
      },
    });
  }

  private _shiftCardLane(card: KanbanCard, delta: -1 | 1): void {
    const laneIdx = this.lanes.findIndex((l) => l.id === card.laneId);
    const targetLane = this.lanes[laneIdx + delta];
    if (!targetLane) return;
    this.moveCard(card.id, targetLane.id);
  }

  override render() {
    const cards = this._activeCards();
    const lanes = this.lanes;
    const status = this.dataCtrl.status;
    const showStatus = status === 'loading' || status === 'error';

    let renderedCardCount = 0;

    return html`
      <div
        part="base"
        class="base"
        role="region"
        aria-label=${this.t('boardLabel')}
        dir=${this.resolvedDir}
      >
        <slot></slot>
        <div class="status" role="status" ?hidden=${!showStatus}>
          ${status === 'error' ? this.t('errorLabel') : this.t('loadingLabel')}
        </div>

        <div class="board">
          ${lanes.map((lane, laneIdx) => {
            const laneCards = cards.filter((c) => c.laneId === lane.id);
            const overWip = lane.wipLimit !== undefined && laneCards.length > lane.wipLimit;
            const badgeText =
              lane.wipLimit !== undefined
                ? overWip
                  ? this.t('overWipBadge', { count: laneCards.length, limit: lane.wipLimit })
                  : this.t('wipLimit', { count: laneCards.length, limit: lane.wipLimit })
                : String(laneCards.length);

            return html`
              <section
                part="lane"
                class="lane"
                aria-label=${lane.label}
                data-lane-id=${lane.id}
                data-over-wip=${overWip ? 'true' : 'false'}
                @dragover=${(e: DragEvent) => {
                  e.preventDefault();
                }}
                @drop=${(e: DragEvent) => {
                  e.preventDefault();
                  const cardId = this.draggedCardId ?? e.dataTransfer?.getData('text/plain');
                  if (cardId) {
                    this.moveCard(cardId, lane.id);
                    this.draggedCardId = null;
                  }
                }}
              >
                <header part="lane-header" class="lane-header">
                  <h3 class="lane-title">${lane.label}</h3>
                  <span part="wip-badge" class="wip-badge">${badgeText}</span>
                </header>

                <div class="cards" role="list">
                  ${laneCards.length === 0
                    ? html`<p class="empty-lane">${this.t('emptyLane')}</p>`
                    : laneCards.map((card) => {
                        const globalIndex = renderedCardCount;
                        renderedCardCount += 1;
                        return html`
                          <div
                            part="card"
                            class="card"
                            role="listitem"
                            draggable="true"
                            data-card-id=${card.id}
                            tabindex=${this.rovingFocus.currentIndex === globalIndex ? '0' : '-1'}
                            @dragstart=${(e: DragEvent) => {
                              this.draggedCardId = card.id;
                              e.dataTransfer?.setData('text/plain', card.id);
                            }}
                            @click=${() => this.emitEvent('mth-card-select', { detail: { card } })}
                          >
                            <span class="card-title">${card.title}</span>
                            <div class="card-footer">
                              <span>${card.assignee ?? card.priority ?? ''}</span>
                              <div class="card-actions">
                                <button
                                  type="button"
                                  class="move-btn"
                                  tabindex="-1"
                                  aria-label=${this.t('movePrevLane')}
                                  ?disabled=${laneIdx === 0}
                                  @click=${(e: Event) => {
                                    e.stopPropagation();
                                    this._shiftCardLane(card, -1);
                                  }}
                                >
                                  ←
                                </button>
                                <button
                                  type="button"
                                  class="move-btn"
                                  tabindex="-1"
                                  aria-label=${this.t('moveNextLane')}
                                  ?disabled=${laneIdx === lanes.length - 1}
                                  @click=${(e: Event) => {
                                    e.stopPropagation();
                                    this._shiftCardLane(card, 1);
                                  }}
                                >
                                  →
                                </button>
                              </div>
                            </div>
                          </div>
                        `;
                      })}
                </div>
              </section>
            `;
          })}
        </div>
      </div>
    `;
  }
}
