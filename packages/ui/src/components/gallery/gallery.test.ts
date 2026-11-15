import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane-ui/ui/carousel';
import '@methane-ui/ui/carousel-item';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { gallerySpec, MthGallery, registerMthGallery, type GalleryItem } from './index.js';

const SAMPLE_GALLERY: ReadonlyArray<GalleryItem> = [
  { src: 'https://example.com/1.jpg', alt: 'Sunset ridge', caption: 'Dusk over the ridge' },
  { src: 'https://example.com/2.jpg', alt: 'Pine valley' },
  { src: 'https://example.com/3.jpg', alt: 'Alpine lake' },
];

describe('<mth-gallery>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, RovingFocusSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(gallerySpec);
    expect(compiled.tests).toContain('<mth-gallery>');

    const specReport = await runBehaviorSpecAssertions(gallerySpec, {
      rovingFocus: {
        mount: async (dir) => {
          const el = document.createElement('mth-gallery') as MthGallery;
          if (dir) el.setAttribute('dir', dir);
          el.label = 'Trip photos';
          el.items = SAMPLE_GALLERY;
          document.body.appendChild(el);
          await el.updateComplete;
          return el;
        },
        getItems: (el) =>
          Array.from((el as MthGallery).shadowRoot!.querySelectorAll<HTMLElement>('[part="thumbnail"]')),
        orientation: 'horizontal',
        loop: true,
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const rovingReport = await RovingFocusSuite.run({
      mount: async (dir) => {
        const el = document.createElement('mth-gallery') as MthGallery;
        if (dir) el.setAttribute('dir', dir);
        el.items = SAMPLE_GALLERY;
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el) =>
        Array.from((el as MthGallery).shadowRoot!.querySelectorAll<HTMLElement>('[part="thumbnail"]')),
      orientation: 'horizontal',
      loop: true,
    });
    expect(rovingReport.passed).toBe(true);

    const ariaEl = document.createElement('mth-gallery') as MthGallery;
    ariaEl.label = 'Showcase';
    ariaEl.items = SAMPLE_GALLERY;
    document.body.append(ariaEl);
    await ariaEl.updateComplete;
    expect(scanSameRootAria(ariaEl.shadowRoot!).issues).toEqual([]);
  });

  it('composes public mth-carousel and mth-lightbox tags and rejects unsafe URLs', async () => {
    const el = document.createElement('mth-gallery') as MthGallery;
    el.items = [
      ...SAMPLE_GALLERY,
      { src: 'javascript:alert(1)', alt: 'Evil URL' },
    ];
    document.body.append(el);
    await el.updateComplete;

    const carousel = el.shadowRoot!.querySelector('mth-carousel');
    const lightbox = el.shadowRoot!.querySelector('mth-lightbox');
    expect(carousel).toBeTruthy();
    expect(lightbox).toBeTruthy();
    expect(el.shadowRoot!.querySelectorAll('[part="slide-image"]').length).toBe(3);

    const slideBtn = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="slide-button"]')[1]!;
    slideBtn.click();
    await el.updateComplete;
    expect(el.lightboxOpen).toBe(true);
    expect(el.activeIndex).toBe(1);
    expect(lightbox!.hasAttribute('open')).toBe(true);

    lightbox!.dispatchEvent(new CustomEvent('mth-close', { bubbles: true }));
    await el.updateComplete;
    expect(el.lightboxOpen).toBe(false);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthGallery();
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-gallery label="Empty gallery"></mth-gallery>`);
    const ssrHtml = rawSsr.replaceAll('mth-gallery>', 'hyd-gallery>').replaceAll('<mth-gallery', '<hyd-gallery');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthGallery('hyd');
        customElements.upgrade(host);
        await (host as MthGallery).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
