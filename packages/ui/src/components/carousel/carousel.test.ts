import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane/ui/carousel-item';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { carouselSpec, MthCarousel, registerMthCarousel } from './index.js';

function createCarouselFixture(dir: 'ltr' | 'rtl' = 'ltr'): MthCarousel {
  const carousel = document.createElement('mth-carousel') as MthCarousel;
  carousel.setAttribute('dir', dir);
  carousel.label = 'Product photos';
  carousel.loop = true;

  for (let i = 1; i <= 3; i++) {
    const item = document.createElement('mth-carousel-item');
    item.setAttribute('label', `Photo ${i}`);
    item.textContent = `Slide ${i}`;
    carousel.appendChild(item);
  }
  return carousel;
}

describe('<mth-carousel>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, RovingFocusSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(carouselSpec);
    expect(compiled.tests).toContain('<mth-carousel>');

    const specReport = await runBehaviorSpecAssertions(carouselSpec, {
      rovingFocus: {
        mount: async (dir) => {
          const el = createCarouselFixture(dir);
          document.body.appendChild(el);
          await el.updateComplete;
          await new Promise((r) => setTimeout(r, 0));
          await el.updateComplete;
          return el;
        },
        getItems: (el) =>
          Array.from((el as MthCarousel).shadowRoot!.querySelectorAll<HTMLElement>('[part="indicator"]')),
        orientation: 'horizontal',
        loop: true,
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const rovingReport = await RovingFocusSuite.run({
      mount: async (dir) => {
        const el = createCarouselFixture(dir);
        document.body.appendChild(el);
        await el.updateComplete;
        await new Promise((r) => setTimeout(r, 0));
        await el.updateComplete;
        return el;
      },
      getItems: (el) =>
        Array.from((el as MthCarousel).shadowRoot!.querySelectorAll<HTMLElement>('[part="indicator"]')),
      orientation: 'horizontal',
      loop: true,
    });
    expect(rovingReport.passed).toBe(true);

    const ariaEl = createCarouselFixture('ltr');
    document.body.appendChild(ariaEl);
    await ariaEl.updateComplete;
    expect(scanSameRootAria(ariaEl.shadowRoot!).issues).toEqual([]);
  });

  it('navigates slides via prev/next controls and emits mth-change', async () => {
    const el = createCarouselFixture('ltr');
    el.loop = false;
    document.body.appendChild(el);
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;

    const events: Array<{ index: number; total: number }> = [];
    el.addEventListener('mth-change', (e) => {
      events.push((e as CustomEvent<{ index: number; total: number }>).detail);
    });

    const prevBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="prev-button"]')!;
    const nextBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="next-button"]')!;
    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);

    nextBtn.click();
    await el.updateComplete;
    expect(el.currentIndex).toBe(1);
    expect(events).toEqual([{ index: 1, total: 3 }]);
    expect(prevBtn.disabled).toBe(false);

    nextBtn.click();
    await el.updateComplete;
    expect(el.currentIndex).toBe(2);
    expect(nextBtn.disabled).toBe(true);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthCarousel();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-carousel label="Gallery"></mth-carousel>`,
    );
    const ssrHtml = rawSsr.replaceAll('mth-carousel>', 'hyd-carousel>').replaceAll('<mth-carousel', '<hyd-carousel');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCarousel('hyd');
        customElements.upgrade(host);
        await (host as MthCarousel).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
