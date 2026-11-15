import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MthClock, clockSpec, registerMthClock } from './index.js';

describe('<mth-clock>', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('compiles spec, formats fixed/live time with analog hands, and cleans up intervals on disconnect', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T14:30:00Z'));

    const compiled = compileSpec(clockSpec);
    expect(compiled.docs).toContain('`<mth-clock>`');

    const report = await runBehaviorSpecAssertions(clockSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const fixedEl = document.createElement('mth-clock') as MthClock;
    fixedEl.value = '2026-08-01T09:15:30Z';
    fixedEl.timeZone = 'UTC';
    document.body.appendChild(fixedEl);
    await fixedEl.updateComplete;

    expect(scanSameRootAria(fixedEl).valid).toBe(true);
    expect(fixedEl.shadowRoot!.querySelector('time')?.textContent?.trim()).toContain('09:15:30');
    expect(fixedEl.shadowRoot!.querySelector('[part="hand-second"]')?.getAttribute('transform')).toBe(
      'rotate(180 50 50)',
    );

    const liveEl = document.createElement('mth-clock') as MthClock;
    liveEl.timeZone = 'UTC';
    document.body.appendChild(liveEl);
    await liveEl.updateComplete;

    expect(liveEl.shadowRoot!.querySelector('time')?.textContent?.trim()).toContain('14:30:00');
    vi.advanceTimersByTime(1000);
    await liveEl.updateComplete;
    expect(liveEl.shadowRoot!.querySelector('time')?.textContent?.trim()).toContain('14:30:01');

    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    liveEl.remove();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-clock value="2026-08-01T09:15:30Z" time-zone="UTC"></mth-clock>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-clock>', 'hyd-clock>')
      .replaceAll('<mth-clock', '<hyd-clock');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthClock('hyd');
        customElements.upgrade(host);
        await (host as MthClock).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
