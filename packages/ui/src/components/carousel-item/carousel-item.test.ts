import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { carouselItemSpec } from './carousel-item.spec.js';
import { MthCarouselItem, registerMthCarouselItem } from './index.js';

describe('<mth-carousel-item>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, renders slide role, and passes same-root ARIA', async () => {
    const compiled = compileSpec(carouselItemSpec);
    expect(compiled.tests).toContain('<mth-carousel-item>');

    const specReport = await runBehaviorSpecAssertions(carouselItemSpec, {});
    expect(specReport.passed).toBe(true);

    const item = document.createElement('mth-carousel-item') as MthCarouselItem;
    item.label = 'Slide 1 of 3';
    item.active = true;
    document.body.append(item);
    await item.updateComplete;

    const base = item.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute('role')).toBe('group');
    expect(base.getAttribute('aria-roledescription')).toBe('slide');
    expect(base.getAttribute('aria-label')).toBe('Slide 1 of 3');
    expect(scanSameRootAria(item.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthCarouselItem();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-carousel-item label="First slide" active>Content</mth-carousel-item>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-carousel-item>', 'hyd-carousel-item>')
      .replaceAll('<mth-carousel-item', '<hyd-carousel-item');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCarouselItem('hyd');
        customElements.upgrade(host);
        await (host as MthCarouselItem).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
