import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthWaveform, registerMthWaveform, waveformSpec } from './index.js';

registerMthWaveform();

describe('<mth-waveform>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes SatelliteEngineSuite + behavior spec assertions', async () => {
    const compiled = compileSpec(waveformSpec);
    expect(compiled.docs).toContain('`<mth-waveform>`');

    const satelliteAdapter = {
      createElement: () => {
        const el = document.createElement('mth-waveform') as MthWaveform;
        el.duration = 60;
        el.setPeaks([0.2, 0.8, 0.4, 0.9, 0.5]);
        return el;
      },
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthWaveform).engine?.getThemeToken(tokenName) ?? '',
    };

    const report = await runBehaviorSpecAssertions(waveformSpec, {
      satellite: satelliteAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run(satelliteAdapter);
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);
  });

  it('supports keyboard scrubbing, RTL direction, audio buffer loading, and unsafe URL guard', async () => {
    const el = document.createElement('mth-waveform') as MthWaveform;
    el.duration = 100;
    el.setPeaks([0.2, 0.8, 0.4, 0.9, 0.5]);
    document.body.appendChild(el);
    await el.updateComplete;

    const scrubber = el.shadowRoot?.querySelector('[part="scrubber"]') as HTMLElement | null;
    expect(scrubber).toBeTruthy();

    scrubber?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(el.currentTime).toBeGreaterThan(0);

    scrubber?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await el.updateComplete;
    expect(el.currentTime).toBe(100);

    scrubber?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await el.updateComplete;
    expect(el.playing).toBe(true);

    el.loadAudioBuffer({
      duration: 42,
      getChannelData: () => new Float32Array([0.1, -0.5, 0.9, -0.3]),
    });
    await el.updateComplete;
    expect(el.duration).toBe(42);
    expect(el.engine?.bars.length).toBe(48);

    expect(scanSameRootAria(el.shadowRoot!).valid).toBe(true);

    const sheetCountBefore = el.shadowRoot!.adoptedStyleSheets.length;
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.adoptedStyleSheets.length).toBe(sheetCountBefore);
    expect(el.engine?.bars.length).toBe(48);

    let errorReason = '';
    el.addEventListener('mth-error', (ev: Event) => {
      errorReason = (ev as CustomEvent<{ reason: string }>).detail.reason;
    });
    el.src = 'javascript:alert(1)';
    await el.updateComplete;
    expect(el.playing).toBe(false);
    expect(errorReason).toContain('Blocked unsafe');
    expect(el.shadowRoot?.querySelector('[role="alert"]')?.textContent).toContain('Blocked unsafe');
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-waveform duration="60" label="Demo clip"><p slot="fallback">Waveform preview</p></mth-waveform>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-waveform>', 'hyd-waveform>')
      .replaceAll('<mth-waveform', '<hyd-waveform');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthWaveform('hyd');
        customElements.upgrade(host);
        await (host as MthWaveform).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
