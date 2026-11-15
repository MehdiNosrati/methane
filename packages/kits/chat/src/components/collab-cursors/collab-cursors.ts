import { UIElement, type PropertyValues } from '@methane/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { resolveEffectiveDir } from '../../shared/dir.js';
import { collabCursorsMessages } from './collab-cursors.messages.js';
import { collabCursorsStyles } from './collab-cursors.styles.js';

export interface CollabCursorSelection {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface CollabCursor {
  readonly id: string;
  readonly name: string;
  readonly color?: string;
  readonly x: number;
  readonly y: number;
  readonly selection?: CollabCursorSelection;
}

const FALLBACK_CURSOR_PALETTE = [
  'var(--mth-color-accent, light-dark(oklch(0.55 0.22 260), oklch(0.72 0.18 260)))',
  'var(--mth-color-success, light-dark(oklch(0.56 0.18 145), oklch(0.72 0.16 145)))',
  'var(--mth-color-warning, light-dark(oklch(0.68 0.16 75), oklch(0.78 0.14 75)))',
  'var(--mth-color-danger, light-dark(oklch(0.55 0.22 25), oklch(0.72 0.18 25)))',
  'var(--mth-color-info, light-dark(oklch(0.58 0.18 220), oklch(0.72 0.16 220)))',
] as const;

const SAFE_OKLCH_RE = /^oklch\(\s*\d+(?:\.\d+)?%?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?(?:\s*\/\s*(?:\d+(?:\.\d+)?%?))?\s*\)$/;
const SAFE_MTH_VAR_RE = /^var\(--mth-color-[a-z0-9-]+\)$/;

function clampCoord(raw: number, max = 100000): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0;
  return Math.round(Math.max(0, Math.min(max, raw)) * 100) / 100;
}

function sanitizeCursorColor(raw: string | undefined, index: number): string {
  const fallback = FALLBACK_CURSOR_PALETTE[index % FALLBACK_CURSOR_PALETTE.length]!;
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (SAFE_OKLCH_RE.test(trimmed) || SAFE_MTH_VAR_RE.test(trimmed)) {
    return trimmed;
  }
  return fallback;
}

function sanitizeLabel(raw: string, fallback: string): string {
  // eslint-disable-next-line no-control-regex
  const cleaned = String(raw ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, 64);
}

/**
 * `<mth-collab-cursors>`: multiplayer live cursor and selection overlay using adopted
 * `CSSStyleSheet` positioning with strict `Number.isFinite`, color, and label sanitization.
 */
export class MthCollabCursors extends UIElement {
  static override messages = collabCursorsMessages;
  static override styles = collabCursorsStyles;

  @property({ attribute: false })
  cursors: ReadonlyArray<CollabCursor> = [];

  @property({ type: String })
  label = '';

  private dynamicSheet: CSSStyleSheet | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncDynamicSheet();
  }

  protected override onMoveBefore(): void {
    super.onMoveBefore();
    this.syncDynamicSheet();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('cursors')) {
      this.syncDynamicSheet();
    }
  }

  private getValidCursors(): ReadonlyArray<CollabCursor> {
    return (this.cursors ?? []).filter(
      (cursor) =>
        cursor &&
        typeof cursor.x === 'number' &&
        Number.isFinite(cursor.x) &&
        typeof cursor.y === 'number' &&
        Number.isFinite(cursor.y),
    );
  }

  private syncDynamicSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    if (!this.dynamicSheet) {
      this.dynamicSheet = new CSSStyleSheet();
    }
    if (typeof this.dynamicSheet.replaceSync !== 'function') {
      return;
    }

    const rules: string[] = [];
    const list = this.getValidCursors();
    list.forEach((cursor, idx) => {
      const safeX = clampCoord(cursor.x);
      const safeY = clampCoord(cursor.y);
      const safeColor = sanitizeCursorColor(cursor.color, idx);
      rules.push(
        `[data-cursor-idx="${idx}"] { --_cursor-x: ${safeX}px; --_cursor-y: ${safeY}px; --_cursor-color: ${safeColor}; }`,
      );
      if (cursor.selection) {
        const sx = clampCoord(cursor.selection.x);
        const sy = clampCoord(cursor.selection.y);
        const sw = clampCoord(cursor.selection.width);
        const sh = clampCoord(cursor.selection.height);
        rules.push(
          `[data-selection-idx="${idx}"] { --_sel-x: ${sx}px; --_sel-y: ${sy}px; --_sel-w: ${sw}px; --_sel-h: ${sh}px; --_cursor-color: ${safeColor}; }`,
        );
      }
    });

    this.dynamicSheet.replaceSync(rules.join('\n'));
    if (!root.adoptedStyleSheets.includes(this.dynamicSheet)) {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.dynamicSheet];
    }
  }

  protected override render() {
    const list = this.getValidCursors();
    const anonymous = this.t('anonymousUser');

    return html`
      <div
        class="base"
        part="base"
        dir=${resolveEffectiveDir(this, this.resolvedDir)}
        role="region"
        aria-label=${this.label || this.t('overlayLabel')}
      >
        ${list.map((cursor, idx) => {
          const displayName = sanitizeLabel(cursor.name, anonymous);
          return html`
            ${cursor.selection
              ? html`
                  <div
                    class="selection"
                    part="selection"
                    data-selection-idx=${String(idx)}
                    aria-hidden="true"
                  ></div>
                `
              : nothing}
            <div
              class="cursor"
              part="cursor"
              data-cursor-idx=${String(idx)}
              data-cursor-id=${sanitizeLabel(cursor.id, String(idx))}
            >
              <svg class="pointer" part="pointer" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M2 1.5L13.5 7.5L8.2 9.2L6.2 14.5L2 1.5Z"
                  fill="currentColor"
                ></path>
              </svg>
              <span class="name" part="name">${displayName}</span>
            </div>
          `;
        })}
      </div>
    `;
  }
}
