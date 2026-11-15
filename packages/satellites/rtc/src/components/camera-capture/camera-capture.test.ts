import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { cameraCaptureSpec, MthCameraCapture, registerMthCameraCapture } from './index.js';

describe('<mth-camera-capture>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes SatelliteEngineSuite + same-root ARIA', async () => {
    const compiled = compileSpec(cameraCaptureSpec);
    expect(compiled.docs).toContain('`<mth-camera-capture>`');

    const satelliteAdapter = {
      createElement: () => document.createElement('mth-camera-capture') as MthCameraCapture,
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthCameraCapture).engine?.getThemeToken(tokenName) ?? '',
    };

    const report = await runBehaviorSpecAssertions(cameraCaptureSpec, {
      satellite: satelliteAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run(satelliteAdapter);
    expect(satReport.passed).toBe(true);
  });

  it('handles graceful unsupported fallback and emits mth-capture snapshot events', async () => {
    const cam = document.createElement('mth-camera-capture') as MthCameraCapture;
    document.body.appendChild(cam);
    await cam.updateComplete;

    let capturedDetail: { dataUrl: string; width: number; height: number } | null = null;
    cam.addEventListener('mth-capture', (ev: Event) => {
      capturedDetail = (ev as CustomEvent<{ dataUrl: string; width: number; height: number }>).detail;
    });

    const ok = await cam.startCamera();
    expect(ok).toBe(false);
    await cam.updateComplete;
    expect(cam.engine?.status).toBe('unsupported');

    const res = cam.capture();
    expect(res).toBeTruthy();
    expect(res!.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(capturedDetail).toEqual(res);

    await cam.updateComplete;
    expect(cam.shadowRoot!.querySelector('[part="snapshot"]')).toBeTruthy();
    expect(scanSameRootAria(cam.shadowRoot!).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM with fallback slot', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-camera-capture label="ID photo"><p slot="fallback">Camera unavailable</p></mth-camera-capture>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-camera-capture>', 'hyd-camera-capture>')
      .replaceAll('<mth-camera-capture', '<hyd-camera-capture');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCameraCapture('hyd');
        customElements.upgrade(host);
        await (host as MthCameraCapture).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
