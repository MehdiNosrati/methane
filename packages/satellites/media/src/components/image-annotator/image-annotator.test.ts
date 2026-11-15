import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import {
  imageAnnotatorSpec,
  MthImageAnnotator,
  registerMthImageAnnotator,
  type ImageAnnotation,
} from './index.js';

registerMthImageAnnotator();

const SAMPLE_ANNOTATIONS: ImageAnnotation[] = [
  { id: 'r1', type: 'rect', x: 10, y: 10, width: 30, height: 20 },
  { id: 'r2', type: 'arrow', x: 20, y: 20, x2: 50, y2: 50 },
  { id: 'r3', type: 'freehand', x: 5, y: 5, points: [{ x: 5, y: 5 }, { x: 25, y: 25 }] },
];

describe('<mth-image-annotator>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes SatelliteEngineSuite + RovingFocusSuite', async () => {
    const compiled = compileSpec(imageAnnotatorSpec);
    expect(compiled.docs).toContain('`<mth-image-annotator>`');

    const satelliteAdapter = {
      createElement: () => {
        const el = document.createElement('mth-image-annotator') as MthImageAnnotator;
        el.src = 'https://example.com/photo.png';
        el.annotations = SAMPLE_ANNOTATIONS;
        return el;
      },
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthImageAnnotator).engine?.getThemeToken(tokenName) ?? '',
    };

    const rovingAdapter = {
      orientation: 'horizontal' as const,
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-image-annotator') as MthImageAnnotator;
        el.setAttribute('dir', dir);
        el.annotations = SAMPLE_ANNOTATIONS;
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (container: HTMLElement) =>
        (container as MthImageAnnotator).getFocusableAnnotations(),
    };

    const report = await runBehaviorSpecAssertions(imageAnnotatorSpec, {
      satellite: satelliteAdapter,
      rovingFocus: rovingAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run(satelliteAdapter);
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);

    const rovReport = await RovingFocusSuite.run(rovingAdapter);
    expect(rovReport.failures).toEqual([]);
    expect(rovReport.passed).toBe(true);
  });

  it('supports vector tools, undo/redo, text sanitization, unsafe image guard, and ARIA scan', async () => {
    const el = document.createElement('mth-image-annotator') as MthImageAnnotator;
    el.src = 'https://example.com/photo.png';
    el.alt = 'Sample photo';
    document.body.appendChild(el);
    await el.updateComplete;

    const added = el.addAnnotation({
      id: 'a1',
      type: 'text',
      x: 20,
      y: 30,
      text: '<script>alert(1)</script>Highlight',
    });
    await el.updateComplete;
    expect(added?.text).toBe('Highlight');
    expect(el.annotations.length).toBe(1);

    el.setTool('arrow');
    el.addAnnotation({ id: 'a2', type: 'arrow', x: 10, y: 10, x2: 80, y2: 60 });
    await el.updateComplete;
    expect(el.annotations.length).toBe(2);

    expect(el.undo()).toBe(true);
    await el.updateComplete;
    expect(el.annotations.length).toBe(1);

    expect(el.redo()).toBe(true);
    await el.updateComplete;
    expect(el.annotations.length).toBe(2);

    expect(scanSameRootAria(el.shadowRoot!).valid).toBe(true);

    el.src = 'javascript:alert(1)';
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('img')).toBeNull();
    expect(el.shadowRoot?.querySelector('[role="alert"]')?.textContent).toContain('Blocked unsafe');
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-image-annotator src="/diagram.png" alt="Diagram"><p slot="fallback">Diagram</p></mth-image-annotator>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-image-annotator>', 'hyd-image-annotator>')
      .replaceAll('<mth-image-annotator', '<hyd-image-annotator');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthImageAnnotator('hyd');
        customElements.upgrade(host);
        await (host as MthImageAnnotator).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
