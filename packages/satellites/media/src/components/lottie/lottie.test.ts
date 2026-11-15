import { DotLottie } from '@lottiefiles/dotlottie-web';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { lottieSpec } from './lottie.spec.js';
import { MthLottie, registerMthLottie } from './index.js';

registerMthLottie();

describe('<mth-lottie>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, wraps @lottiefiles/dotlottie-web, and passes SatelliteEngineSuite', async () => {
    const compiled = compileSpec(lottieSpec);
    expect(compiled.docs).toContain('`<mth-lottie>`');
    expect(typeof DotLottie).toBe('function');

    const satelliteAdapter = {
      createElement: () => {
        const el = document.createElement('mth-lottie') as MthLottie;
        el.src = 'https://example.com/demo.lottie';
        return el;
      },
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthLottie).engine?.getThemeToken(tokenName) ?? '',
    };

    const report = await runBehaviorSpecAssertions(lottieSpec, {
      satellite: satelliteAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run(satelliteAdapter);
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);
  });

  it('controls playback, freezes on prefers-reduced-motion, and blocks unsafe URLs', async () => {
    const el = document.createElement('mth-lottie') as MthLottie;
    el.src = 'https://example.com/demo.lottie';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.play()).toBe(true);
    await el.updateComplete;
    expect(el.playing).toBe(true);

    el.stop();
    await el.updateComplete;
    expect(el.playing).toBe(false);
    expect(scanSameRootAria(el.shadowRoot!).valid).toBe(true);

    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.engine).toBeTruthy();

    let errorReason = '';
    el.addEventListener('mth-error', (ev: Event) => {
      errorReason = (ev as CustomEvent<{ reason: string }>).detail.reason;
    });
    el.src = 'javascript:alert(1)';
    await el.updateComplete;
    expect(el.play()).toBe(false);
    expect(errorReason).toContain('Blocked unsafe');
    expect(el.shadowRoot?.querySelector('[role="alert"]')?.textContent).toContain('Blocked unsafe');
    el.remove();

    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    try {
      const reducedEl = document.createElement('mth-lottie') as MthLottie;
      reducedEl.autoplay = true;
      document.body.appendChild(reducedEl);
      await reducedEl.updateComplete;
      expect(reducedEl.engine?.frozen).toBe(true);
      expect(reducedEl.play()).toBe(false);
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-lottie src="/anim.lottie" label="Loading"><span slot="fallback">Loading</span></mth-lottie>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-lottie>', 'hyd-lottie>')
      .replaceAll('<mth-lottie', '<hyd-lottie');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthLottie('hyd');
        customElements.upgrade(host);
        await (host as MthLottie).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('updates speed/loop playback parameters and respects disabled guard', async () => {
    const el = document.createElement('mth-lottie') as MthLottie;
    el.src = 'https://example.com/demo.lottie';
    el.speed = -2;
    el.loop = false;
    document.body.appendChild(el);
    await el.updateComplete;

    // Invalid non-positive speed normalizes to 1
    expect(el.speed).toBe(1);
    el.speed = 1.5;
    await el.updateComplete;
    expect(el.speed).toBe(1.5);

    el.disabled = true;
    await el.updateComplete;
    expect(el.hasCustomState('disabled')).toBe(true);
  });

  it('accepts inline animationData object without src and blocks data: URI src', async () => {
    const el = document.createElement('mth-lottie') as MthLottie;
    el.animationData = { v: '5.5.7', fr: 30, ip: 0, op: 30, w: 100, h: 100, layers: [] } as never;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.play()).toBe(true);

    el.src = 'data:text/html,<script>alert(1)</script>';
    await el.updateComplete;
    expect(el.play()).toBe(false);
  });
});
