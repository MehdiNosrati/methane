import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { imageCropperSpec } from './image-cropper.spec.js';
import { MthImageCropper, registerMthImageCropper } from './index.js';

describe('<mth-image-cropper>', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      drawImage: () => {},
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,mockcrop',
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => {
      cb(new Blob(['crop'], { type: 'image/png' }));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('pans via keyboard arrows, rejects unsafe javascript: src, and renders SVG only via <img>', async () => {
    const compiled = compileSpec(imageCropperSpec);
    expect(compiled.docs).toContain('`<mth-image-cropper>`');

    const cropper = document.createElement('mth-image-cropper') as MthImageCropper;
    cropper.src = 'javascript:alert(1)';
    cropper.alt = 'Unsafe source';
    document.body.appendChild(cropper);
    await cropper.updateComplete;
    expect(cropper.shadowRoot!.querySelector('img')).toBeNull();

    cropper.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    cropper.alt = 'Vector avatar';
    await cropper.updateComplete;
    const img = cropper.shadowRoot!.querySelector('img');
    expect(img).not.toBeNull();
    expect(cropper.shadowRoot!.querySelector('svg')).toBeNull();

    const viewport = cropper.shadowRoot!.querySelector<HTMLElement>('[part="viewport"]')!;
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    viewport.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true, bubbles: true }),
    );
    await cropper.updateComplete;
    expect(cropper.offsetX).toBe(1);
    expect(cropper.offsetY).toBe(-5);

    let cropFired = false;
    cropper.addEventListener('mth-crop', () => {
      cropFired = true;
    });
    const res = await cropper.crop();
    expect(cropFired).toBe(true);
    expect(res.rect.offsetX).toBe(1);

    cropper.reset();
    await cropper.updateComplete;
    expect(cropper.offsetX).toBe(0);
    expect(cropper.offsetY).toBe(0);
    expect(cropper.zoom).toBe(1);

    expect(scanSameRootAria(cropper).issues).toEqual([]);
    const specReport = await runBehaviorSpecAssertions(imageCropperSpec, {});
    expect(specReport.failures).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-image-cropper alt="Preview"></mth-image-cropper>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-image-cropper>', 'hyd-image-cropper>')
      .replaceAll('<mth-image-cropper', '<hyd-image-cropper');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthImageCropper('hyd');
        customElements.upgrade(host);
        await (host as MthImageCropper).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
