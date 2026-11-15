import { UIElement, type PropertyValues } from '@methane/core';
import { registerMthBadge } from '@methane/ui/badge';
import { registerMthCheckbox } from '@methane/ui/checkbox';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { facetFiltersMessages } from './facet-filters.messages.js';
import { facetFiltersStyles } from './facet-filters.styles.js';

export interface FacetOption {
  readonly value: string;
  readonly label: string;
  readonly count?: number;
  readonly color?: string;
  readonly disabled?: boolean;
}

export interface FacetGroup {
  readonly id: string;
  readonly label: string;
  readonly type: 'checkbox' | 'swatch' | 'range';
  readonly collapsed?: boolean;
  readonly options?: ReadonlyArray<FacetOption>;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
}

export interface FacetRangeValue {
  readonly min?: number;
  readonly max?: number;
}

function sanitizeColorExpr(raw: string | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (/^--mth-[a-z0-9-]+$/i.test(trimmed)) return `var(${trimmed})`;
  if (/^oklch\(\s*[0-9.]+%?\s+[0-9.]+\s+[0-9.]+(?:\s*\/\s*[0-9.%]+)?\s*\)$/i.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-z]{3,20}$/i.test(trimmed)) return trimmed;
  return '';
}

function sanitizeKey(raw: string): string {
  return raw.replace(/[^A-Za-z0-9_-]/g, '_');
}

/**
 * `<mth-facet-filters>`: collapsible attribute filter sidebar composing `@methane/ui/checkbox`
 * and `@methane/ui/badge`, with CSP-safe adopted-stylesheet color swatches and numeric ranges.
 */
export class MthFacetFilters extends UIElement {
  static override messages = facetFiltersMessages;
  static override styles = facetFiltersStyles;

  @property({ attribute: false })
  facets: ReadonlyArray<FacetGroup> = [];

  @property({ attribute: false })
  selected: Record<string, ReadonlyArray<string>> = {};

  @property({ attribute: false })
  ranges: Record<string, FacetRangeValue> = {};

  @property({ type: Boolean })
  collapsible = true;

  @property({ type: String })
  label = '';

  @state()
  private collapsedGroups: Record<string, boolean> = {};

  private swatchSheet: CSSStyleSheet | null = null;

  constructor() {
    super();
    registerMthBadge();
    registerMthCheckbox();
  }

  private get hasActiveFilters(): boolean {
    const anySelected = Object.values(this.selected ?? {}).some((arr) => arr.length > 0);
    const anyRange = Object.values(this.ranges ?? {}).some(
      (r) => typeof r.min === 'number' || typeof r.max === 'number',
    );
    return anySelected || anyRange;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncSwatchSheet();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (changed.has('facets')) {
      const nextCollapsed: Record<string, boolean> = { ...this.collapsedGroups };
      for (const group of this.facets ?? []) {
        if (!(group.id in nextCollapsed)) {
          nextCollapsed[group.id] = Boolean(group.collapsed);
        }
      }
      this.collapsedGroups = nextCollapsed;
    }
    this.setCustomState('has-active-filters', this.hasActiveFilters);
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('facets')) {
      this.syncSwatchSheet();
    }
  }

  private syncSwatchSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    const rules: string[] = [];
    for (const group of this.facets ?? []) {
      if (group.type !== 'swatch') continue;
      for (const opt of group.options ?? []) {
        const expr = sanitizeColorExpr(opt.color);
        if (!expr) continue;
        const key = `${sanitizeKey(group.id)}_${sanitizeKey(opt.value)}`;
        rules.push(`.swatch[data-swatch-key="${key}"] { --_ff-swatch: ${expr}; }`);
      }
    }
    if (!this.swatchSheet) {
      this.swatchSheet = new CSSStyleSheet();
    }
    if (typeof this.swatchSheet.replaceSync === 'function') {
      this.swatchSheet.replaceSync(rules.join('\n'));
      if (!root.adoptedStyleSheets.includes(this.swatchSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.swatchSheet];
      }
    }
  }

  private toggleOption(groupId: string, value: string): void {
    const current = new Set(this.selected?.[groupId] ?? []);
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }
    const nextSelected = { ...this.selected, [groupId]: Array.from(current) };
    this.selected = nextSelected;
    this.emitEvent('mth-filter-change', {
      detail: {
        groupId,
        selected: nextSelected,
        ranges: this.ranges ?? {},
      },
    });
  }

  private updateRange(groupId: string, bound: 'min' | 'max', raw: string): void {
    const num = raw.trim() === '' ? undefined : Number(raw);
    const prev = this.ranges?.[groupId] ?? {};
    const nextGroup: FacetRangeValue = {
      ...prev,
      [bound]: typeof num === 'number' && Number.isFinite(num) ? num : undefined,
    };
    const nextRanges = { ...this.ranges, [groupId]: nextGroup };
    this.ranges = nextRanges;
    this.emitEvent('mth-filter-change', {
      detail: {
        groupId,
        selected: this.selected ?? {},
        ranges: nextRanges,
      },
    });
  }

  clearAll(): void {
    this.selected = {};
    this.ranges = {};
    this.emitEvent('mth-filter-clear', { detail: {} });
    this.emitEvent('mth-filter-change', { detail: { groupId: '', selected: {}, ranges: {} } });
  }

  protected override render() {
    const groups = this.facets ?? [];

    return html`
      <aside class="root" part="base" dir=${this.resolvedDir} aria-label=${this.label || this.t('regionLabel')}>
        <div class="top-bar">
          <h2 class="heading">${this.label || this.t('regionLabel')}</h2>
          ${this.hasActiveFilters
            ? html`
                <button
                  type="button"
                  class="clear-btn"
                  part="clear-button"
                  @click=${() => this.clearAll()}
                >
                  ${this.t('clearAllLabel')}
                </button>
              `
            : nothing}
        </div>

        ${groups.length === 0
          ? html`<span>${this.t('emptyLabel')}</span>`
          : groups.map((group) => {
              const isCollapsed = this.collapsible && Boolean(this.collapsedGroups[group.id]);
              const activeValues = this.selected?.[group.id] ?? [];
              const rangeVal = this.ranges?.[group.id] ?? {};

              return html`
                <section class="group" part="group" aria-label=${group.label}>
                  <button
                    type="button"
                    class="group-toggle"
                    part="group-toggle"
                    aria-expanded=${isCollapsed ? 'false' : 'true'}
                    @click=${() => {
                      if (!this.collapsible) return;
                      this.collapsedGroups = {
                        ...this.collapsedGroups,
                        [group.id]: !isCollapsed,
                      };
                    }}
                  >
                    <span>${group.label}</span>
                    <span aria-hidden="true">${isCollapsed ? '+' : '-'}</span>
                  </button>

                  ${isCollapsed
                    ? nothing
                    : group.type === 'swatch'
                      ? html`
                          <div class="swatches">
                            ${(group.options ?? []).map((opt) => {
                              const pressed = activeValues.includes(opt.value);
                              const key = `${sanitizeKey(group.id)}_${sanitizeKey(opt.value)}`;
                              return html`
                                <button
                                  type="button"
                                  class="swatch"
                                  part="swatch"
                                  data-swatch-key=${key}
                                  aria-label=${opt.label}
                                  aria-pressed=${pressed ? 'true' : 'false'}
                                  ?disabled=${Boolean(opt.disabled)}
                                  @click=${() => this.toggleOption(group.id, opt.value)}
                                ></button>
                              `;
                            })}
                          </div>
                        `
                      : group.type === 'range'
                        ? html`
                            <div class="range-row">
                              <label class="range-field">
                                <span>${this.t('minLabel')}</span>
                                <input
                                  class="range-input"
                                  type="number"
                                  .value=${typeof rangeVal.min === 'number' ? String(rangeVal.min) : ''}
                                  min=${group.min !== undefined ? String(group.min) : ''}
                                  max=${group.max !== undefined ? String(group.max) : ''}
                                  step=${group.step !== undefined ? String(group.step) : '1'}
                                  @change=${(e: Event) =>
                                    this.updateRange(group.id, 'min', (e.target as HTMLInputElement).value)}
                                />
                              </label>
                              <label class="range-field">
                                <span>${this.t('maxLabel')}</span>
                                <input
                                  class="range-input"
                                  type="number"
                                  .value=${typeof rangeVal.max === 'number' ? String(rangeVal.max) : ''}
                                  min=${group.min !== undefined ? String(group.min) : ''}
                                  max=${group.max !== undefined ? String(group.max) : ''}
                                  step=${group.step !== undefined ? String(group.step) : '1'}
                                  @change=${(e: Event) =>
                                    this.updateRange(group.id, 'max', (e.target as HTMLInputElement).value)}
                                />
                              </label>
                            </div>
                          `
                        : html`
                            <div class="options">
                              ${(group.options ?? []).map((opt) => {
                                const checked = activeValues.includes(opt.value);
                                return html`
                                  <div class="check-row">
                                    <mth-checkbox
                                      ?checked=${checked}
                                      ?disabled=${Boolean(opt.disabled)}
                                      @mth-change=${() => this.toggleOption(group.id, opt.value)}
                                    >
                                      ${opt.label}
                                    </mth-checkbox>
                                    ${typeof opt.count === 'number'
                                      ? html`<mth-badge size="sm" variant="neutral">${opt.count}</mth-badge>`
                                      : nothing}
                                  </div>
                                `;
                              })}
                            </div>
                          `}
                </section>
              `;
            })}
      </aside>
    `;
  }
}
