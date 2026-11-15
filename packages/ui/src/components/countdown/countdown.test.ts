import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MthCountdown, countdownSpec, registerMthCountdown } from './index.js';

describe('<mth-countdown>', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('compiles spec, counts down seconds, emits mth-complete, and clears intervals on disconnect', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00Z'));

    const compiled = compileSpec(countdownSpec);
    expect(compiled.docs).toContain('`<mth-countdown>`');

    const report = await runBehaviorSpecAssertions(countdownSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-countdown') as MthCountdown;
    el.duration = 2;
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).valid).toBe(true);
    expect(el.shadowRoot!.querySelector('time')?.getAttribute('datetime')).toBe('PT0H0M2S');

    const completeSpy = vi.fn();
    el.addEventListener('mth-complete', completeSpy);

    vi.advanceTimersByTime(1000);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('time')?.getAttribute('datetime')).toBe('PT0H0M1S');

    vi.advanceTimersByTime(1000);
    await el.updateComplete;
    expect(completeSpy).toHaveBeenCalledTimes(1);
    expect(el.running).toBe(false);

    // Disconnecting cancels active timers cleanly
    el.duration = 10;
    el.reset();
    el.start();
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    el.remove();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-countdown duration="90" ?running=${false}></mth-countdown>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-countdown>', 'hyd-countdown>')
      .replaceAll('<mth-countdown', '<hyd-countdown');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCountdown('hyd');
        customElements.upgrade(host);
        await (host as MthCountdown).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
