import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthZoomPan, registerMthZoomPan, zoomPanSpec, type ZoomPanChangeDetail } from './index.js';

describe('<mth-zoom-pan>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and same-root ARIA', async () => {
    const compiled = compileSpec(zoomPanSpec);
    expect(compiled.tests).toContain('<mth-zoom-pan>');

    const specReport = await runBehaviorSpecAssertions(zoomPanSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-zoom-pan') as MthZoomPan;
    el.label = 'Diagram viewer';
    document.body.append(el);
    await el.updateComplete;

    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('zooms in, pans via keyboard, resets, and clamps bounds', async () => {
    const el = document.createElement('mth-zoom-pan') as MthZoomPan;
    el.minScale = 1;
    el.maxScale = 2;
    el.step = 0.5;
    document.body.append(el);
    await el.updateComplete;

    const changes: ZoomPanChangeDetail[] = [];
    el.addEventListener('mth-change', (e) => {
      changes.push((e as CustomEvent<ZoomPanChangeDetail>).detail);
    });

    const zoomInBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="zoom-in"]')!;
    zoomInBtn.click();
    await el.updateComplete;
    expect(el.scale).toBe(1.5);

    const viewport = el.shadowRoot!.querySelector<HTMLElement>('[part="viewport"]')!;
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(el.panX).toBe(-24);

    zoomInBtn.click();
    zoomInBtn.click();
    await el.updateComplete;
    expect(el.scale).toBe(2);
    expect(zoomInBtn.disabled).toBe(true);

    const resetBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="reset"]')!;
    resetBtn.click();
    await el.updateComplete;
    expect(el.scale).toBe(1);
    expect(el.panX).toBe(0);
    expect(el.panY).toBe(0);
    expect(changes.length).toBeGreaterThanOrEqual(4);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthZoomPan();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-zoom-pan label="Map" scale="1.5"></mth-zoom-pan>`,
    );
    const ssrHtml = rawSsr.replaceAll('mth-zoom-pan>', 'hyd-zoom-pan>').replaceAll('<mth-zoom-pan', '<hyd-zoom-pan');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthZoomPan('hyd');
        customElements.upgrade(host);
        await (host as MthZoomPan).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
