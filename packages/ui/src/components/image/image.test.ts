import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { imageSpec, MthImage, registerMthImage } from './index.js';

describe('<mth-image>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and same-root ARIA', async () => {
    const compiled = compileSpec(imageSpec);
    expect(compiled.tests).toContain('<mth-image>');

    const specReport = await runBehaviorSpecAssertions(imageSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-image') as MthImage;
    el.src = 'https://example.com/photo.jpg';
    el.alt = 'Mountain vista';
    el.aspectRatio = '16/9';
    document.body.append(el);
    await el.updateComplete;

    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('rejects unsafe javascript/data URLs and swaps to fallbackSrc on error', async () => {
    const el = document.createElement('mth-image') as MthImage;
    el.src = 'javascript:alert(1)';
    el.alt = 'Unsafe check';
    document.body.append(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('img')).toBeNull();
    expect(el.shadowRoot!.querySelector<HTMLElement>('[part="fallback"]')!.hidden).toBe(false);

    el.src = 'https://example.com/broken.png';
    el.fallbackSrc = 'https://example.com/fallback.png';
    await el.updateComplete;

    const img = el.shadowRoot!.querySelector<HTMLImageElement>('[part="img"]')!;
    expect(img.getAttribute('src')).toBe('https://example.com/broken.png');

    img.dispatchEvent(new Event('error'));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector<HTMLImageElement>('[part="img"]')!.getAttribute('src')).toBe(
      'https://example.com/fallback.png',
    );

    const loadedEvents: string[] = [];
    el.addEventListener('mth-load', (e) => {
      loadedEvents.push((e as CustomEvent<{ src: string }>).detail.src);
    });
    el.shadowRoot!.querySelector<HTMLImageElement>('[part="img"]')!.dispatchEvent(new Event('load'));
    await el.updateComplete;
    expect(loadedEvents).toEqual(['https://example.com/fallback.png']);
  });

  it('rejects unsafe aspectRatio and fit payloads before writing adopted CSS', async () => {
    const el = document.createElement('mth-image') as MthImage;
    el.src = 'https://example.com/photo.jpg';
    el.alt = 'CSS guard check';
    el.aspectRatio = '16/9; background: url(https://evil.example/x)';
    (el as unknown as { fit: string }).fit = 'cover; color: red';
    document.body.append(el);
    await el.updateComplete;

    const sheets = el.shadowRoot!.adoptedStyleSheets ?? [];
    const cssText = sheets
      .map((sheet) =>
        Array.from(sheet.cssRules ?? [])
          .map((rule) => rule.cssText)
          .join('\n'),
      )
      .join('\n');
    expect(cssText).not.toContain('evil.example');
    expect(cssText).not.toContain('color: red');
    expect(cssText).not.toContain('--_aspect-ratio');
    expect(cssText).toContain('--_fit: cover');
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthImage();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-image src="https://example.com/hero.jpg" alt="Hero" aspect-ratio="16/9"></mth-image>`,
    );
    const ssrHtml = rawSsr.replaceAll('mth-image>', 'hyd-image>').replaceAll('<mth-image', '<hyd-image');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthImage('hyd');
        customElements.upgrade(host);
        await (host as MthImage).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
