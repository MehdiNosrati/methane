import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthLightbox, lightboxSpec, registerMthLightbox } from './index.js';

describe('<mth-lightbox>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite conformance', async () => {
    const compiled = compileSpec(lightboxSpec);
    expect(compiled.docs).toContain('`<mth-lightbox>`');

    const report = await runBehaviorSpecAssertions(lightboxSpec, {
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'Open gallery';
          const overlay = document.createElement('mth-lightbox') as MthLightbox;
          overlay.label = 'Photo viewer';
          overlay.items = [
            { src: 'https://example.com/1.png', alt: 'First', caption: 'Slide 1' },
            { src: 'https://example.com/2.png', alt: 'Second', caption: 'Slide 2' },
          ];
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthLightbox).show();
        },
        close: async (overlay) => {
          await (overlay as MthLightbox).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthLightbox).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: false,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const suiteReport = await OverlaySuite.run({
      mount: () => {
        const trigger = document.createElement('button');
        const overlay = document.createElement('mth-lightbox') as MthLightbox;
        overlay.items = [{ src: '/img/a.png', alt: 'A' }];
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthLightbox).show();
      },
      close: async (overlay) => {
        await (overlay as MthLightbox).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthLightbox).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: false,
    });
    expect(suiteReport.passed).toBe(true);
  });

  it('supports keyboard navigation, zoom toggle, and blocks unsafe URLs', async () => {
    const lb = document.createElement('mth-lightbox') as MthLightbox;
    lb.items = [
      { src: 'https://example.com/a.jpg', alt: 'Alpha', caption: 'Alpha image' },
      { src: 'javascript:alert(1)', alt: 'Blocked' },
    ];
    document.body.appendChild(lb);
    await lb.show();
    await lb.updateComplete;

    expect(lb.shadowRoot!.querySelector('img')?.getAttribute('src')).toBe('https://example.com/a.jpg');
    expect(scanSameRootAria(lb).valid).toBe(true);

    const zoomBtn = lb.shadowRoot!.querySelector<HTMLButtonElement>('[part="zoom-button"]')!;
    zoomBtn.click();
    await lb.updateComplete;
    expect(lb.hasCustomState('zoomed')).toBe(true);

    const dialog = lb.shadowRoot!.querySelector('dialog')!;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await lb.updateComplete;
    expect(lb.index).toBe(1);
    expect(lb.shadowRoot!.querySelector('img')).toBeNull();
    expect(lb.shadowRoot!.querySelector('[role="alert"]')?.textContent).toContain('blocked');
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM rendered via @lit-labs/ssr', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-lightbox label="Viewer">Fallback content</mth-lightbox>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('<mth-lightbox', '<hyd-lightbox')
      .replaceAll('</mth-lightbox>', '</hyd-lightbox>');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthLightbox('hyd');
        customElements.upgrade(host);
        await (host as MthLightbox).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
