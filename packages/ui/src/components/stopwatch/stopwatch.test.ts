import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MthStopwatch, registerMthStopwatch, stopwatchSpec } from './index.js';

describe('<mth-stopwatch>', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('compiles spec, tracks start/lap/pause/reset with tabular readout, and cleans up intervals', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T00:00:00Z'));

    const compiled = compileSpec(stopwatchSpec);
    expect(compiled.docs).toContain('`<mth-stopwatch>`');

    const report = await runBehaviorSpecAssertions(stopwatchSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-stopwatch') as MthStopwatch;
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).valid).toBe(true);
    expect(el.shadowRoot!.querySelector('time')?.textContent?.trim()).toBe('00:00.00');

    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="toggle"]')!.click();
    await el.updateComplete;
    expect(el.running).toBe(true);

    vi.advanceTimersByTime(1250);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('time')?.textContent?.trim()).toBe('00:01.25');

    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="lap"]')!.click();
    await el.updateComplete;
    expect(el.laps).toHaveLength(1);
    expect(el.laps[0]?.lapMs).toBe(1250);

    vi.advanceTimersByTime(750);
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="toggle"]')!.click();
    await el.updateComplete;
    expect(el.running).toBe(false);
    expect(el.elapsedMs).toBe(2000);

    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="reset"]')!.click();
    await el.updateComplete;
    expect(el.elapsedMs).toBe(0);
    expect(el.laps).toHaveLength(0);

    el.start();
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    el.remove();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-stopwatch></mth-stopwatch>`);
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-stopwatch>', 'hyd-stopwatch>')
      .replaceAll('<mth-stopwatch', '<hyd-stopwatch');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthStopwatch('hyd');
        customElements.upgrade(host);
        await (host as MthStopwatch).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
