import { runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { reviewSummarySpec } from './review-summary.spec.js';
import { MthReviewSummary, registerMthReviewSummary } from './index.js';

describe('<mth-review-summary>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, toggles star filter, and uses adopted CSSStyleSheet without inline styles', async () => {
    const report = await runBehaviorSpecAssertions(reviewSummarySpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-review-summary') as MthReviewSummary;
    el.average = 4.6;
    el.totalReviews = 10;
    el.breakdown = { 5: 7, 4: 2, 3: 1, 2: 0, 1: 0 };
    document.body.append(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelectorAll('[style]').length).toBe(0);
    expect(el.shadowRoot!.querySelector('[part="score"]')?.textContent?.trim()).toBe('4.6');

    const picked: Array<number | null> = [];
    el.addEventListener('mth-rating-filter', (e) => {
      picked.push((e as CustomEvent<{ star: number | null }>).detail.star);
    });
    const firstRow = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="row"]')!;
    firstRow.click();
    await el.updateComplete;
    expect(el.activeStar).toBe(5);
    expect(el.hasCustomState('filtered')).toBe(true);
    firstRow.click();
    await el.updateComplete;
    expect(el.activeStar).toBeNull();
    expect(picked).toEqual([5, null]);
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite cleanly', async () => {
    registerMthReviewSummary();
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-review-summary average="4.5" total-reviews="8"></mth-review-summary>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-review-summary>', 'hyd-review-summary>')
      .replaceAll('<mth-review-summary', '<hyd-review-summary');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthReviewSummary('hyd');
        customElements.upgrade(host);
        await (host as MthReviewSummary).updateComplete;
      },
    });
    expect(purity.passed).toBe(true);
  });
});
