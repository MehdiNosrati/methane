import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { qrCodeSpec } from './qr-code.spec.js';
import { encodeQrMatrix, MthQrCode, registerMthQrCode } from './index.js';

describe('<mth-qr-code>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and same-root ARIA', async () => {
    const compiled = compileSpec(qrCodeSpec);
    expect(compiled.tests).toContain('<mth-qr-code>');

    const specReport = await runBehaviorSpecAssertions(qrCodeSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-qr-code') as MthQrCode;
    el.value = 'https://methane.dev/docs';
    el.label = 'Open Methane docs';
    document.body.append(el);
    await el.updateComplete;

    const svgEl = el.shadowRoot!.querySelector('svg')!;
    expect(svgEl.getAttribute('role')).toBe('img');
    expect(svgEl.getAttribute('aria-label')).toBe('Open Methane docs');
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('generates deterministic QR matrices with intact 7x7 finder patterns', () => {
    const a = encodeQrMatrix('https://methane.dev', 'M');
    const b = encodeQrMatrix('https://methane.dev', 'M');
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(21);

    // Top-left 7x7 finder corner border must be dark
    for (let i = 0; i < 7; i++) {
      expect(a[0]![i]).toBe(true);
      expect(a[6]![i]).toBe(true);
      expect(a[i]![0]).toBe(true);
      expect(a[i]![6]).toBe(true);
    }
    expect(a[3]![3]).toBe(true);
  });

  it('passes HydrationPuritySuite without mutating SSR DOM', async () => {
    registerMthQrCode();
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-qr-code value="hello-methane" label="QR" size="128"></mth-qr-code>`,
    );
    const ssrHtml = rawSsr.replaceAll('mth-qr-code>', 'hyd-qr-code>').replaceAll('<mth-qr-code', '<hyd-qr-code');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthQrCode('hyd');
        customElements.upgrade(host);
        await (host as MthQrCode).updateComplete;
      },
    });
    expect(report.passed).toBe(true);
  });
});
