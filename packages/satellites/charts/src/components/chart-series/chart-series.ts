import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { MTH_CHART_TYPES, type MthChartType } from '../shared/chart-types.js';
import { chartSeriesMessages } from './chart-series.messages.js';
import { chartSeriesStyles } from './chart-series.styles.js';

export { MTH_CHART_TYPES, type MthChartType };

/**
 * `<mth-chart-series>`: Declarative series child consumed by `<mth-chart>`.
 */
export class MthChartSeries extends UIElement {
  static override messages = chartSeriesMessages;
  static override styles = chartSeriesStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String, reflect: true })
  type: MthChartType = 'line';

  @property({ type: String, attribute: 'data-json' })
  dataJson = '';

  @property({ attribute: false })
  data: ReadonlyArray<unknown> = [];

  @property({ type: String })
  stack = '';

  @property({ type: String })
  color = '';

  @property({ type: Boolean, reflect: true })
  smooth = false;

  @property({ type: Boolean, reflect: true })
  override hidden = false;

  @property({ type: Number, attribute: 'x-axis-index' })
  xAxisIndex = 0;

  @property({ type: Number, attribute: 'y-axis-index' })
  yAxisIndex = 0;

  @property({ attribute: false })
  seriesOptions: Record<string, unknown> = {};

  getResolvedData(): ReadonlyArray<unknown> {
    if (Array.isArray(this.data) && this.data.length > 0) {
      return this.data;
    }
    if (this.dataJson.trim().length > 0) {
      try {
        const parsed = JSON.parse(this.dataJson) as unknown;
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return [];
      }
    }
    return this.data;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('hidden')) {
      this.setCustomState('hidden', this.hidden);
    }
    if (
      changed.has('name') ||
      changed.has('type') ||
      changed.has('data') ||
      changed.has('dataJson') ||
      changed.has('stack') ||
      changed.has('color') ||
      changed.has('smooth') ||
      changed.has('hidden') ||
      changed.has('xAxisIndex') ||
      changed.has('yAxisIndex') ||
      changed.has('seriesOptions')
    ) {
      if (this.isConnected) {
        this.emitEvent('mth-series-change', {
          detail: { name: this.name, type: this.type },
        });
      }
    }
  }

  override render() {
    return html`<div part="base" aria-label=${this.t('seriesLabel')}><slot></slot></div>`;
  }
}
