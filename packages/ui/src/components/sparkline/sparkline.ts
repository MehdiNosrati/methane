import { UIElement, type PropertyValues } from '@methane/core';
import { FormattingUtils } from '@methane/primitives';
import { html, nothing, svg } from 'lit';
import { property } from 'lit/decorators.js';
import { sparklineMessages } from './sparkline.messages.js';
import { sparklineStyles } from './sparkline.styles.js';

export type MthSparklineType = 'line' | 'area' | 'bar';
export type MthSparklineVariant = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

interface SparkPoint {
  readonly x: number;
  readonly y: number;
  readonly value: number;
}

const VIEW_WIDTH = 200;
const VIEW_HEIGHT = 48;
const PAD_X = 4;
const PAD_Y = 6;

function parseDataSeries(raw: string): number[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[\s,]+/)
    .map((token) => Number(token.trim()))
    .filter((num) => Number.isFinite(num));
}

/**
 * `<mth-sparkline>`: accessible inline SVG sparkline with `<title>`, `<desc>`,
 * and deterministic SSR-friendly summary fallback.
 */
export class MthSparkline extends UIElement {
  static override messages = sparklineMessages;
  static override styles = sparklineStyles;

  @property({ attribute: false })
  values: ReadonlyArray<number> = [];

  @property({ type: String })
  data = '';

  @property({ type: String, reflect: true })
  type: MthSparklineType = 'line';

  @property({ type: String, reflect: true })
  variant: MthSparklineVariant = 'accent';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, attribute: 'show-points', reflect: true })
  showPoints = false;

  @property({ type: Number })
  min: number | null = null;

  @property({ type: Number })
  max: number | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('empty', this.resolveSeries().length === 0);
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('values') || changedProperties.has('data')) {
      this.setCustomState('empty', this.resolveSeries().length === 0);
    }
  }

  resolveSeries(): ReadonlyArray<number> {
    if (this.values.length > 0) {
      return this.values.filter((v) => Number.isFinite(v));
    }
    return parseDataSeries(this.data);
  }

  private computeGeometry(series: ReadonlyArray<number>): {
    points: SparkPoint[];
    minVal: number;
    maxVal: number;
  } {
    const rawMin = Math.min(...series);
    const rawMax = Math.max(...series);
    const minVal = this.min !== null && Number.isFinite(this.min) ? this.min : rawMin;
    const maxVal = this.max !== null && Number.isFinite(this.max) ? this.max : rawMax;
    const span = maxVal - minVal || 1;
    const plotW = VIEW_WIDTH - PAD_X * 2;
    const plotH = VIEW_HEIGHT - PAD_Y * 2;

    const points = series.map((value, idx) => {
      const ratioX = series.length === 1 ? 0.5 : idx / (series.length - 1);
      const ratioY = (value - minVal) / span;
      const x = Math.round((PAD_X + ratioX * plotW) * 100) / 100;
      const y = Math.round((PAD_Y + (1 - Math.min(Math.max(ratioY, 0), 1)) * plotH) * 100) / 100;
      return { x, y, value };
    });

    return { points, minVal, maxVal };
  }

  override render() {
    const series = this.resolveSeries();
    const titleText = this.label.trim() || this.t('defaultLabel');
    const locale = this.resolvedLocale || 'en';

    if (series.length === 0) {
      return html`
        <div part="base" class="base" data-variant=${this.variant} data-empty="true">
          <div part="summary" class="summary">
            <slot>${this.t('emptySummary')}</slot>
          </div>
        </div>
      `;
    }

    const { points, minVal, maxVal } = this.computeGeometry(series);
    const latest = series[series.length - 1]!;
    const summaryText = this.t('summaryTemplate', {
      count: FormattingUtils.formatNumber(series.length, locale),
      min: FormattingUtils.formatNumber(minVal, locale),
      max: FormattingUtils.formatNumber(maxVal, locale),
      latest: FormattingUtils.formatNumber(latest, locale),
    });

    const lineCoords = points.map((p) => `${p.x},${p.y}`).join(' ');
    const baselineY = VIEW_HEIGHT - PAD_Y;
    const areaCoords = `${points[0]!.x},${baselineY} ${lineCoords} ${points[points.length - 1]!.x},${baselineY}`;

    const barSlotWidth = (VIEW_WIDTH - PAD_X * 2) / series.length;
    const barWidth = Math.max(2, Math.round(barSlotWidth * 0.68 * 100) / 100);

    return html`
      <figure part="base" class="base" data-variant=${this.variant}>
        <span id="mth-spark-title" class="sr-only">${titleText}</span>
        <svg
          part="svg"
          class="svg"
          viewBox="0 0 200 48"
          role="img"
          aria-label=${titleText}
          aria-labelledby="mth-spark-title"
          aria-describedby="mth-spark-desc"
        >
          <!-- Note: @lit-labs/ssr parses <title> as RCDATA and rejects child expressions; #mth-spark-title + <desc> supply full localized SVG-AAM name & description. -->
          <desc id="mth-spark-desc">${summaryText}</desc>
          ${this.type === 'bar'
            ? points.map((pt, idx) => {
                const bx = Math.round((PAD_X + idx * barSlotWidth + (barSlotWidth - barWidth) / 2) * 100) / 100;
                const bh = Math.max(2, Math.round((baselineY - pt.y) * 100) / 100);
                return svg`<rect part="bar" class="bar" x=${bx} y=${pt.y} width=${barWidth} height=${bh} rx="1"></rect>`;
              })
            : svg`
                ${this.type === 'area' ? svg`<polygon part="area" class="area" points=${areaCoords}></polygon>` : nothing}
                <polyline part="line" class="line" points=${lineCoords}></polyline>
                ${this.showPoints
                  ? points.map((pt) => svg`<circle part="point" class="point" cx=${pt.x} cy=${pt.y} r="2.5"></circle>`)
                  : nothing}
              `}
        </svg>
        <figcaption part="summary" class="summary sr-only">
          <slot>${summaryText}</slot>
        </figcaption>
      </figure>
    `;
  }
}
